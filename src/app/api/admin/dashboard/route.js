import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

function getDateRange(period) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

function toDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildChartData(period, orders) {
  const now = new Date();

  if (period === "today") {
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, "0")}:00`,
      revenue: orders
        .filter(
          (o) =>
            o.status === "delivered" &&
            new Date(o.createdAt).getHours() === h
        )
        .reduce((s, o) => s + o.grandTotal, 0),
      count: orders.filter((o) => new Date(o.createdAt).getHours() === h)
        .length,
    }));
  }

  if (period === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dateStr = toDateStr(d);
      return {
        label: d.toLocaleDateString("en", { weekday: "short" }),
        revenue: orders
          .filter(
            (o) => o.status === "delivered" && toDateStr(o.createdAt) === dateStr
          )
          .reduce((s, o) => s + o.grandTotal, 0),
        count: orders.filter((o) => toDateStr(o.createdAt) === dateStr).length,
      };
    });
  }

  if (period === "month") {
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return {
        label: String(day),
        revenue: orders
          .filter(
            (o) => o.status === "delivered" && toDateStr(o.createdAt) === dateStr
          )
          .reduce((s, o) => s + o.grandTotal, 0),
        count: orders.filter((o) => toDateStr(o.createdAt) === dateStr).length,
      };
    });
  }

  // year
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((label, i) => ({
    label,
    revenue: orders
      .filter(
        (o) =>
          o.status === "delivered" &&
          new Date(o.createdAt).getMonth() === i
      )
      .reduce((s, o) => s + o.grandTotal, 0),
    count: orders.filter((o) => new Date(o.createdAt).getMonth() === i).length,
  }));
}

export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";
  const { start, end } = getDateRange(period);

  try {
    const [orders, newCustomers, totalCustomers, totalProducts, recentOrders, lowStockItems] =
      await Promise.all([
        prisma.order.findMany({
          where: { createdAt: { gte: start, lte: end } },
          select: { id: true, status: true, grandTotal: true, createdAt: true },
        }),
        prisma.customer.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.customer.count(),
        prisma.product.count({ where: { active: true } }),
        prisma.order.findMany({
          where: { createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
        }),
        // Low-stock: fetch all active stocks with a threshold set, filter in JS
        prisma.stock.findMany({
          where: {
            active: true,
            lowStockThresholdGrams: { gt: 0 },
          },
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            currentStockGrams: true,
            lowStockThresholdGrams: true,
          },
          orderBy: { currentStockGrams: "asc" },
        }),
      ]);

    // Revenue buckets — only delivered counts as earned
    const confirmedRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.grandTotal, 0);

    const pendingRevenue = orders
      .filter((o) => o.status === "pending")
      .reduce((s, o) => s + o.grandTotal, 0);

    const inProgressRevenue = orders
      .filter((o) => ["confirmed", "preparing", "out_for_delivery"].includes(o.status))
      .reduce((s, o) => s + o.grandTotal, 0);

    const cancelledRevenue = orders
      .filter((o) => o.status === "cancelled")
      .reduce((s, o) => s + o.grandTotal, 0);

    // Order counts by status
    const byStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const deliveredCount = byStatus.delivered || 0;
    const avgOrderValue = deliveredCount > 0 ? confirmedRevenue / deliveredCount : 0;

    // Filter low stock in JS: currentStockGrams <= lowStockThresholdGrams
    const lowStock = lowStockItems
      .filter((s) => Number(s.currentStockGrams) <= Number(s.lowStockThresholdGrams))
      .map((s) => ({
        id: s.id,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        currentStockGrams: Number(s.currentStockGrams),
        lowStockThreshold: Number(s.lowStockThresholdGrams),
        pct: Number(s.lowStockThresholdGrams) > 0
          ? Math.round((Number(s.currentStockGrams) / Number(s.lowStockThresholdGrams)) * 100)
          : 0,
      }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        revenue: {
          confirmed: confirmedRevenue,
          pending: pendingRevenue,
          inProgress: inProgressRevenue,
          cancelled: cancelledRevenue,
          total: confirmedRevenue + inProgressRevenue,
        },
        orders: {
          total: orders.length,
          byStatus,
          avgValue: avgOrderValue,
        },
        customers: { new: newCustomers, total: totalCustomers },
        products: { total: totalProducts },
        chart: buildChartData(period, orders),
        recentOrders,
        lowStock,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ success: false, message: "Failed to load dashboard data" }, { status: 500 });
  }
}
