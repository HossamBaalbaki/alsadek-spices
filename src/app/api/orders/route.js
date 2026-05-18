import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWeightLabelToGrams } from "@/lib/stock";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";
import { rateLimit, getIP, tooManyRequests } from "@/lib/rateLimit";

// ─── GENERATE ORDER NUMBER ───────────────────────────
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ASQ-${timestamp}${random}`;
}

// ─── INPUT SANITIZATION ───────────────────────────
function sanitizeStr(s, maxLen = 200) {
  if (typeof s !== "string") return "";
  return s.replace(/[<>]/g, "").trim().slice(0, maxLen);
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

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

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
  // ─── RATE LIMIT: 5 orders per IP per minute (idempotency guard) ───────────
  const ip = getIP(request);
  const rl = rateLimit(`order:${ip}`, { windowMs: 60_000, max: 5 });
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  try {
    const body = await request.json();

    const {
      customer: rawCustomer,
      items,
      subtotal,
      deliveryFee,
      discountAmount,
      grandTotal,
      paymentMethod,
      deliveryZone,
      promoCode: rawPromoCode,
    } = body;

    // ─── SANITIZE INPUTS ───────────────────────────
    const customer = rawCustomer ? {
      firstName:  sanitizeStr(rawCustomer.firstName, 100),
      lastName:   sanitizeStr(rawCustomer.lastName,  100),
      phone:      sanitizeStr(rawCustomer.phone,      30),
      email:      sanitizeStr(rawCustomer.email,     200),
      address:    sanitizeStr(rawCustomer.address,   300),
      building:   sanitizeStr(rawCustomer.building,  100),
      floor:      sanitizeStr(rawCustomer.floor,      50),
      apartment:  sanitizeStr(rawCustomer.apartment,  50),
      city:       sanitizeStr(rawCustomer.city,      100),
      notes:      sanitizeStr(rawCustomer.notes,     500),
    } : null;
    const promoCode = rawPromoCode ? sanitizeStr(rawPromoCode, 50) : null;

    // ─── VALIDATE ───────────────────────────
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
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

    // Pre-validate items + build deduction metadata
    // Supports both new (stockId-based, pcs) and legacy (productId-based, grams) items.
    const singleDeductions = []; // { stockId, grams, nameEn } — legacy gram-based
    const bundleDeductions = []; // { productId, quantity, nameEn } — legacy bundle
    const pcsDeductions = [];   // { stockId, quantity, nameEn } — new pcs-based

    for (const item of items) {
      const qty = Number(item.quantity) || 1;

      // ─── NEW PATH: item carries stockId directly ───────────────────────────
      if (item.stockId && typeof item.stockId === "number") {
        const stock = await prisma.stock.findUnique({ where: { id: item.stockId } });
        if (!stock) {
          return NextResponse.json(
            { success: false, message: `Item not found: ${sanitizeStr(item.nameEn || String(item.stockId))}` },
            { status: 400 }
          );
        }
        if (stock.currentStockPcs < qty) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for: ${stock.nameEn}` },
            { status: 409 }
          );
        }
        pcsDeductions.push({ stockId: stock.id, quantity: qty, nameEn: stock.nameEn });
        continue;
      }

      // ─── LEGACY PATH: item carries productId ──────────────────────────────
      // First check if productId actually maps to a Stock (post-migration items from shop)
      const stockById = item.productId
        ? await prisma.stock.findUnique({ where: { id: item.productId } })
        : null;

      if (stockById) {
        if (stockById.currentStockPcs < qty) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for: ${stockById.nameEn}` },
            { status: 409 }
          );
        }
        pcsDeductions.push({ stockId: stockById.id, quantity: qty, nameEn: stockById.nameEn });
        continue;
      }

      if (!item.productId || typeof item.productId !== "number") {
        return NextResponse.json({ success: false, message: "Invalid item in order" }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stock: true },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${sanitizeStr(item.nameEn || String(item.productId))}` },
          { status: 400 }
        );
      }

      if (product.type === "single") {
        if (!product.stock) {
          return NextResponse.json(
            { success: false, message: `Stock not linked for product: ${product.nameEn}` },
            { status: 400 }
          );
        }

        let unitGrams =
          Number(item.grams) > 0
            ? Number(item.grams)
            : parseWeightLabelToGrams(item.weight);

        if (!unitGrams || unitGrams <= 0) {
          const variantList = Array.isArray(product.variants) ? product.variants : [];
          if (variantList.length > 0) unitGrams = Number(variantList[0]?.grams || 0);
        }

        if (!unitGrams || unitGrams <= 0) {
          return NextResponse.json(
            { success: false, message: `Invalid variant weight for: ${product.nameEn}` },
            { status: 400 }
          );
        }

        const neededGrams = unitGrams * qty;
        if (Number(product.stock.currentStockGrams) < neededGrams) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for: ${product.nameEn}` },
            { status: 409 }
          );
        }
        singleDeductions.push({ stockId: product.stock.id, grams: neededGrams, unitGrams, nameEn: product.nameEn });
      } else if (product.type === "bundle") {
        const available = Number(product.bundleStock) || 0;
        if (available < qty) {
          return NextResponse.json(
            { success: false, message: `Insufficient finished stock for: ${product.nameEn}` },
            { status: 409 }
          );
        }
        bundleDeductions.push({ productId: product.id, quantity: qty, nameEn: product.nameEn });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      // ─── ATOMIC STOCK DEDUCTION (fixes race condition) ───────────────────
      // updateMany with WHERE stock >= needed ensures the check+decrement is one atomic SQL statement.
      // Two concurrent requests cannot both succeed — the second will see count=0 and throw.
      for (const d of singleDeductions) {
        const result = await tx.stock.updateMany({
          where: { id: d.stockId, currentStockGrams: { gte: d.grams } },
          data: { currentStockGrams: { decrement: d.grams } },
        });
        if (result.count === 0) {
          throw new Error(`STOCK_INSUFFICIENT:${d.nameEn}`);
        }
      }

      for (const d of bundleDeductions) {
        const result = await tx.product.updateMany({
          where: { id: d.productId, bundleStock: { gte: d.quantity } },
          data: { bundleStock: { decrement: d.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`STOCK_INSUFFICIENT:${d.nameEn}`);
        }
      }

      for (const d of pcsDeductions) {
        const result = await tx.stock.updateMany({
          where: { id: d.stockId, currentStockPcs: { gte: d.quantity } },
          data: { currentStockPcs: { decrement: d.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`STOCK_INSUFFICIENT:${d.nameEn}`);
        }
      }

      // Create or update customer
      let dbCustomer = await tx.customer.findFirst({
        where: { phone: customer.phone },
      });

      if (!dbCustomer) {
        dbCustomer = await tx.customer.create({
          data: {
            firstName: customer.firstName,
            lastName:  customer.lastName,
            phone:     customer.phone,
            email:     customer.email     || null,
            address:   customer.address   || null,
            building:  customer.building  || null,
            floor:     customer.floor     || null,
            apartment: customer.apartment || null,
            city:      customer.city      || null,
            notes:     customer.notes     || null,
          },
        });
      } else {
        dbCustomer = await tx.customer.update({
          where: { id: dbCustomer.id },
          data: {
            firstName: customer.firstName,
            lastName:  customer.lastName,
            email:     customer.email     || dbCustomer.email,
            address:   customer.address   || dbCustomer.address,
            building:  customer.building  || dbCustomer.building,
            floor:     customer.floor     || dbCustomer.floor,
            apartment: customer.apartment || dbCustomer.apartment,
            city:      customer.city      || dbCustomer.city,
            notes:     customer.notes     || dbCustomer.notes,
          },
        });
      }

      const orderNumber = generateOrderNumber();

      // ─── PROMO usedCount INSIDE TRANSACTION (fixes promo race condition) ───
      // Re-check inside the transaction so the increment rolls back if order creation fails.
      if (promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { code: promoCode.toUpperCase().trim() },
        });
        if (promo && promo.active && (!promo.maxUses || promo.usedCount < promo.maxUses)) {
          await tx.promoCode.update({
            where: { id: promo.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: dbCustomer.id,
          subtotal:       subtotal       || 0,
          deliveryFee:    deliveryFee    || 0,
          discountAmount: discountAmount || 0,
          grandTotal:     grandTotal     || 0,
          paymentMethod:  paymentMethod  || "cash",
          paymentStatus:  "pending",
          status:         "pending",
          deliveryZone:   deliveryZone   || null,
          promoCode:      promoCode      || null,
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

              // Resolve stockId: explicit stockId takes priority, then check pcsDeductions
              // to find if this item's productId was resolved to a Stock entry.
              const resolvedStockId =
                item.stockId ||
                pcsDeductions.find((d) => d.stockId === item.productId)?.stockId ||
                null;

              const row = {
                productId:     resolvedStockId ? null : (item.productId || null),
                stockId:       resolvedStockId || null,
                nameEn:        sanitizeStr(item.nameEn || ""),
                nameAr:        sanitizeStr(item.nameAr || ""),
                price:         Number(item.price)    || 0,
                quantity:      Number(item.quantity) || 1,
                weight:        item.weight || null,
                type:          item.type   || "single",
                grams:         grams > 0 ? grams : undefined,
                gramsDeducted: grams > 0 ? grams * (Number(item.quantity) || 1) : undefined,
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

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.message?.startsWith("STOCK_INSUFFICIENT:")) {
      const productName = error.message.replace("STOCK_INSUFFICIENT:", "");
      return NextResponse.json(
        { success: false, message: `Insufficient stock for: ${productName}` },
        { status: 409 }
      );
    }

    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}
