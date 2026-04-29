import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

export async function GET(request) {
  if (!verifyAdmin(request)) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [orders, topProducts] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { select: { nameEn: true, quantity: true, price: true } },
        },
      }),
      prisma.orderItem.groupBy({
        by: ["nameEn"],
        where: { order: { ...where, status: "delivered" } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
    ]);

    const delivered = orders.filter((o) => o.status === "delivered");
    const cancelled = orders.filter((o) => o.status === "cancelled");
    const pending = orders.filter((o) => o.status === "pending");
    const inProgress = orders.filter((o) => ["confirmed", "preparing", "out_for_delivery"].includes(o.status));

    const revenue = delivered.reduce((s, o) => s + o.grandTotal, 0);
    const avgOrder = delivered.length > 0 ? revenue / delivered.length : 0;

    const byDay = {};
    for (const o of orders) {
      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { orders: 0, revenue: 0 };
      byDay[day].orders += 1;
      if (o.status === "delivered") byDay[day].revenue += o.grandTotal;
    }

    const promoUsage = {};
    for (const o of orders) {
      if (o.promoCode) {
        promoUsage[o.promoCode] = (promoUsage[o.promoCode] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders: orders.length,
          delivered: delivered.length,
          cancelled: cancelled.length,
          pending: pending.length,
          inProgress: inProgress.length,
          revenue,
          avgOrder,
          cancelRate: orders.length > 0 ? (cancelled.length / orders.length) * 100 : 0,
        },
        topProducts: topProducts.map((p) => ({ name: p.nameEn, qty: p._sum.quantity || 0 })),
        byDay: Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, v]) => ({ date, ...v })),
        promoUsage: Object.entries(promoUsage)
          .sort(([, a], [, b]) => b - a)
          .map(([code, count]) => ({ code, count })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json({ success: false, message: "Failed to load reports" }, { status: 500 });
  }
}
