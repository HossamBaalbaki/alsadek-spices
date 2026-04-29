import { verifyAdmin, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  if (!verifyAdmin(request)) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true, city: true } },
        items: true,
      },
    });

    const escape = (v) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      "Order Number", "Date", "Customer", "Phone", "City",
      "Items", "Subtotal", "Delivery Fee", "Discount", "Grand Total",
      "Payment Method", "Payment Status", "Status", "Promo Code", "Delivery Zone",
    ];

    const rows = orders.map((o) => [
      escape(o.orderNumber),
      escape(new Date(o.createdAt).toISOString().slice(0, 10)),
      escape(`${o.customer?.firstName ?? ""} ${o.customer?.lastName ?? ""}`.trim()),
      escape(o.customer?.phone ?? ""),
      escape(o.customer?.city ?? ""),
      escape(o.items?.length ?? 0),
      escape(Number(o.subtotal).toFixed(2)),
      escape(Number(o.deliveryFee).toFixed(2)),
      escape(Number(o.discountAmount).toFixed(2)),
      escape(Number(o.grandTotal).toFixed(2)),
      escape(o.paymentMethod),
      escape(o.paymentStatus),
      escape(o.status),
      escape(o.promoCode ?? ""),
      escape(o.deliveryZone ?? ""),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/orders/export error:", error);
    return new Response("Export failed", { status: 500 });
  }
}
