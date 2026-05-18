import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const raw = params?.id;
    if (!raw) {
      return NextResponse.json({ success: false, message: "Missing product identifier" }, { status: 400 });
    }

    const asNumber = Number(raw);
    const isNumericId = Number.isFinite(asNumber) && /^\d+$/.test(String(raw));

    const stock = await prisma.stock.findFirst({
      where: {
        active: true,
        OR: isNumericId
          ? [{ id: asNumber }, { slug: String(raw) }]
          : [{ slug: String(raw) }],
      },
      include: {
        category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
      },
    });

    if (!stock) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const labels = stock.labels || {};
    const salePct = labels.isSale && Number(labels.salePercent) > 0 ? Number(labels.salePercent) : 0;
    const variants = Array.isArray(stock.variants)
      ? stock.variants.map((v) => {
          const base = Number(v.price) || 0;
          return {
            ...v,
            price: salePct > 0 ? Math.round(base * (1 - salePct / 100) * 100) / 100 : base,
            originalPrice: salePct > 0 ? base : null,
          };
        })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        ...stock,
        variants,
        soldOut: stock.currentStockPcs <= 0,
      },
    });
  } catch (error) {
    console.error("GET /api/products/id/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch product" }, { status: 500 });
  }
}
