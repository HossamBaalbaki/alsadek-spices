import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

export async function GET(request, context) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!customer) return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });

    const totalSpend = customer.orders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.grandTotal, 0);

    return NextResponse.json({ success: true, data: { ...customer, totalSpend } });
  } catch (error) {
    console.error("GET /api/admin/customers/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch customer" }, { status: 500 });
  }
}
