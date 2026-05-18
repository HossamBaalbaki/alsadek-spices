import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function attachComputedPrice(stock) {
  if (!stock) return stock;

  const labels = stock.labels || {};
  const salePct = labels.isSale && Number(labels.salePercent) > 0 ? Number(labels.salePercent) : 0;

  if (stock.type === "single") {
    const variants = Array.isArray(stock.variants) ? stock.variants : [];
    const enrichedVariants = variants.map((v) => {
      const base = Number(v.price) || 0;
      return {
        ...v,
        price: salePct > 0 ? Math.round(base * (1 - salePct / 100) * 100) / 100 : base,
        originalPrice: salePct > 0 ? base : null,
        available: stock.currentStockPcs > 0,
      };
    });
    return {
      ...stock,
      variants: enrichedVariants,
      price: Number(enrichedVariants[0]?.price || 0),
      soldOut: stock.currentStockPcs <= 0,
    };
  }

  return {
    ...stock,
    price: Number(stock.price || 0),
    soldOut: stock.currentStockPcs <= 0,
  };
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const slug = params.slug;

    const stockRaw = await prisma.stock.findFirst({
      where: { slug, active: true },
      include: {
        category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        reviews: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        bundleContents: {
          include: {
            stock: { select: { id: true, nameEn: true, nameAr: true, currentStockPcs: true, images: true } },
          },
        },
      },
    });

    if (!stockRaw) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const relatedRaw = await prisma.stock.findMany({
      where: {
        categoryId: stockRaw.categoryId,
        active: true,
        slug: { not: null },
        NOT: { id: stockRaw.id },
      },
      take: 4,
    });

    const stock = attachComputedPrice(stockRaw);
    const related = relatedRaw.map(attachComputedPrice);

    return NextResponse.json({ success: true, data: { ...stock, related } });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch product" }, { status: 500 });
  }
}
