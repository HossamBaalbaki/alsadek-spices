import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";
import { rateLimit, getIP, tooManyRequests } from "@/lib/rateLimit";

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ASQ-${timestamp}${random}`;
}

function sanitizeStr(s, maxLen = 200) {
  if (typeof s !== "string") return "";
  return s.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

// ─── GET ALL ORDERS (admin only) ─────────────────────────────────────────────
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
        include: { customer: true, items: true },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 });
  }
}

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
export async function POST(request) {
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

    // ─── SANITIZE ─────────────────────────────────────────────────────────────
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

    // ─── VALIDATE ─────────────────────────────────────────────────────────────
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "Customer and items are required" }, { status: 400 });
    }
    if (!customer.firstName || !customer.lastName || !customer.phone) {
      return NextResponse.json({ success: false, message: "Customer name and phone are required" }, { status: 400 });
    }

    // ─── VALIDATE PROMO CODE ──────────────────────────────────────────────────
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode.toUpperCase().trim() } });
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

    // ─── VALIDATE STOCK (pre-check) ───────────────────────────────────────────
    const deductions = [];
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const stockId = Number(item.stockId);

      if (!stockId || !Number.isFinite(stockId)) {
        return NextResponse.json({ success: false, message: "Invalid item in order" }, { status: 400 });
      }

      const stock = await prisma.stock.findUnique({ where: { id: stockId } });
      if (!stock) {
        return NextResponse.json(
          { success: false, message: `Item not found: ${sanitizeStr(item.nameEn || String(stockId))}` },
          { status: 400 }
        );
      }
      if (stock.currentStockPcs < qty) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for: ${stock.nameEn}` },
          { status: 409 }
        );
      }
      deductions.push({ stockId: stock.id, quantity: qty, nameEn: stock.nameEn });
    }

    // ─── TRANSACTION ──────────────────────────────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      // Atomic stock deduction — WHERE currentStockPcs >= qty prevents race conditions
      for (const d of deductions) {
        const result = await tx.stock.updateMany({
          where: { id: d.stockId, currentStockPcs: { gte: d.quantity } },
          data: { currentStockPcs: { decrement: d.quantity } },
        });
        if (result.count === 0) throw new Error(`STOCK_INSUFFICIENT:${d.nameEn}`);
      }

      // Create or update customer
      let dbCustomer = await tx.customer.findFirst({ where: { phone: customer.phone } });
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

      // Increment promo usage inside transaction so it rolls back on failure
      if (promoCode) {
        const promo = await tx.promoCode.findUnique({ where: { code: promoCode.toUpperCase().trim() } });
        if (promo && promo.active && (!promo.maxUses || promo.usedCount < promo.maxUses)) {
          await tx.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
        }
      }

      return tx.order.create({
        data: {
          orderNumber:    generateOrderNumber(),
          customerId:     dbCustomer.id,
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
            create: items.map((item) => ({
              stockId:  Number(item.stockId),
              productId: null,
              nameEn:   sanitizeStr(item.nameEn || ""),
              nameAr:   sanitizeStr(item.nameAr || ""),
              price:    Number(item.price)    || 0,
              quantity: Number(item.quantity) || 1,
              weight:   item.weight || null,
              type:     item.type   || "single",
              ...(item.bundleBreakdown ? { bundleBreakdown: item.bundleBreakdown } : {}),
            })),
          },
        },
        include: { customer: true, items: true },
      });
    });

    return NextResponse.json({ success: true, message: "Order created successfully", data: order }, { status: 201 });
  } catch (error) {
    if (error.message?.startsWith("STOCK_INSUFFICIENT:")) {
      const name = error.message.replace("STOCK_INSUFFICIENT:", "");
      return NextResponse.json({ success: false, message: `Insufficient stock for: ${name}` }, { status: 409 });
    }
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ success: false, message: "Failed to create order" }, { status: 500 });
  }
}
