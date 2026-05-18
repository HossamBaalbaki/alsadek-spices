import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── TRACK ORDER (by orderNumber OR phone) ───────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").trim();

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Order number or phone is required" },
        { status: 400 }
      );
    }

    const includeShape = {
      customer: true,
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: true,
              nameEn: true,
              nameAr: true,
            },
          },
        },
      },
    };

    // Try as order number (case-insensitive: stored uppercase)
    const orderNumber = query.toUpperCase();
    let orders = await prisma.order.findMany({
      where: { orderNumber },
      include: includeShape,
      orderBy: { createdAt: "desc" },
    });

    // If not found, try as phone (normalize - keep digits + leading +)
    if (orders.length === 0) {
      const normalized = query.replace(/[^\d+]/g, "");
      if (normalized.length >= 4) {
        orders = await prisma.order.findMany({
          where: {
            customer: {
              OR: [
                { phone: normalized },
                { phone: { contains: normalized } },
                { phone: { contains: normalized.replace(/^\+?974/, "") } },
              ],
            },
          },
          include: includeShape,
          orderBy: { createdAt: "desc" },
          take: 20,
        });
      }
    }

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No order found. Please check your order number or phone number and try again.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET /api/track error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to track order" },
      { status: 500 }
    );
  }
}
