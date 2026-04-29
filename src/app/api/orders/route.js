import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWeightLabelToGrams } from "@/lib/stock";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

// ─── GENERATE ORDER NUMBER ───────────────────────────
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ASQ-${timestamp}${random}`;
}

// ─── GET ALL ORDERS (admin only) ───────────────────────────
export async function GET(request) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          customer: true,
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// ─── CREATE ORDER ───────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      customer,
      items,
      subtotal,
      deliveryFee,
      discountAmount,
      grandTotal,
      paymentMethod,
      deliveryZone,
      promoCode,
    } = body;

    // ─── VALIDATE ───────────────────────────
    if (!customer || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Customer and items are required" },
        { status: 400 }
      );
    }

    if (!customer.firstName || !customer.lastName || !customer.phone) {
      return NextResponse.json(
        { success: false, message: "Customer name and phone are required" },
        { status: 400 }
      );
    }

    // ─── VALIDATE PROMO CODE ───────────────────────────
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase().trim() },
      });
      if (!promo || !promo.active) {
        return NextResponse.json({ success: false, message: "Promo code is invalid or inactive" }, { status: 400 });
      }
      if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
        return NextResponse.json({ success: false, message: "This promo code has expired" }, { status: 400 });
      }
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return NextResponse.json({ success: false, message: "This promo code has reached its maximum uses" }, { status: 400 });
      }
    }

    // Pre-validate products + build deduction lists
    const singleDeductions = []; // { stockId, grams }
    const bundleDeductions = []; // { productId, quantity }

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stock: true },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.nameEn || item.productId}` },
          { status: 400 }
        );
      }

      if (product.type === "single") {
        if (!product.stock) {
          return NextResponse.json(
            { success: false, message: `Stock not linked for product: ${item.nameEn || product.nameEn}` },
            { status: 400 }
          );
        }

        let unitGrams =
          Number(item.grams) > 0
            ? Number(item.grams)
            : parseWeightLabelToGrams(item.weight);

        if (!unitGrams || unitGrams <= 0) {
          const variantList = Array.isArray(product.variants) ? product.variants : [];
          if (variantList.length > 0) {
            unitGrams = Number(variantList[0]?.grams || 0);
          }
        }

        if (!unitGrams || unitGrams <= 0) {
          return NextResponse.json(
            { success: false, message: `Invalid variant weight for: ${item.nameEn || product.nameEn}` },
            { status: 400 }
          );
        }

        const neededGrams = unitGrams * (Number(item.quantity) || 1);
        if (Number(product.stock.currentStockGrams) < neededGrams) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for: ${item.nameEn || product.nameEn}` },
            { status: 409 }
          );
        }

        singleDeductions.push({ stockId: product.stock.id, grams: neededGrams, unitGrams });
      } else if (product.type === "bundle") {
        const qty = Number(item.quantity) || 1;
        const available = Number(product.bundleStock) || 0;

        if (available < qty) {
          return NextResponse.json(
            { success: false, message: `Insufficient finished stock for: ${item.nameEn || product.nameEn}` },
            { status: 409 }
          );
        }

        bundleDeductions.push({ productId: product.id, quantity: qty });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      // Deduct single-product stock
      for (const d of singleDeductions) {
        await tx.stock.update({
          where: { id: d.stockId },
          data: { currentStockGrams: { decrement: d.grams } },
        });
      }

      // Deduct bundle finished-goods stock
      for (const d of bundleDeductions) {
        await tx.product.update({
          where: { id: d.productId },
          data: { bundleStock: { decrement: d.quantity } },
        });
      }

      // Create or update customer
      let dbCustomer = await tx.customer.findFirst({
        where: { phone: customer.phone },
      });

      if (!dbCustomer) {
        dbCustomer = await tx.customer.create({
          data: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            email: customer.email || null,
            address: customer.address || null,
            building: customer.building || null,
            floor: customer.floor || null,
            apartment: customer.apartment || null,
            city: customer.city || null,
            notes: customer.notes || null,
          },
        });
      } else {
        dbCustomer = await tx.customer.update({
          where: { id: dbCustomer.id },
          data: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email || dbCustomer.email,
            address: customer.address || dbCustomer.address,
            building: customer.building || dbCustomer.building,
            floor: customer.floor || dbCustomer.floor,
            apartment: customer.apartment || dbCustomer.apartment,
            city: customer.city || dbCustomer.city,
            notes: customer.notes || dbCustomer.notes,
          },
        });
      }

      const orderNumber = generateOrderNumber();

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: dbCustomer.id,
          subtotal: subtotal || 0,
          deliveryFee: deliveryFee || 0,
          discountAmount: discountAmount || 0,
          grandTotal: grandTotal || 0,
          paymentMethod: paymentMethod || "cash",
          paymentStatus: "pending",
          status: "pending",
          deliveryZone: deliveryZone || null,
          promoCode: promoCode || null,
          items: {
            create: items.map((item) => {
              let grams =
                Number(item.grams) > 0
                  ? Number(item.grams)
                  : parseWeightLabelToGrams(item.weight);

              if ((!grams || grams <= 0) && (item.type || "single") === "single") {
                const matched = items.find((x) => x.productId === item.productId);
                if (matched && Number(matched.grams) > 0) {
                  grams = Number(matched.grams);
                }
              }

              const row = {
                productId: item.productId,
                nameEn: item.nameEn,
                nameAr: item.nameAr,
                price: item.price,
                quantity: item.quantity,
                weight: item.weight || null,
                type: item.type || "single",
                grams: grams > 0 ? grams : undefined,
                gramsDeducted:
                  grams > 0 ? grams * (Number(item.quantity) || 1) : undefined,
              };

              if (item.bundleBreakdown) {
                row.bundleBreakdown = item.bundleBreakdown;
              }

              return row;
            }),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return createdOrder;
    });

    // Increment usedCount outside the transaction so a missing code never breaks order creation
    if (promoCode) {
      try {
        await prisma.promoCode.updateMany({
          where: { code: promoCode },
          data: { usedCount: { increment: 1 } },
        });
      } catch (promoErr) {
        console.error("Promo usedCount increment failed (non-fatal):", promoErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}
