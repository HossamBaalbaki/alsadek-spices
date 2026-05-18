import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichSingleVariants } from "@/lib/stock";

function attachComputedPrice(product) {
  if (!product) return product;

  if (product.type === "single") {
    const enriched = enrichSingleVariants(product);
    const fallbackVariants = Array.isArray(product.variants) ? product.variants : [];

    const safeVariants =
      Array.isArray(enriched) && enriched.length > 0
        ? enriched
        : fallbackVariants.map((v) => ({
            weightLabel: v?.weightLabel || v?.weight || "",
            grams: Number(v?.grams || 0),
            price: Number(v?.price || 0),
            originalPrice: Number(v?.originalPrice || 0) || null,
            available: v?.available !== false,
          }));

    return {
      ...product,
      variants: safeVariants,
      price: Number(safeVariants[0]?.price || product.price || 0),
    };
  }

  return {
    ...product,
    price: Number(product.price || 0),
  };
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const raw = params?.id;

    if (!raw) {
      return NextResponse.json(
        { success: false, message: "Missing product identifier" },
        { status: 400 }
      );
    }

    const asNumber = Number(raw);
    const isNumericId = Number.isFinite(asNumber) && /^\d+$/.test(String(raw));

    const productRaw = await prisma.product.findFirst({
      where: {
        active: true,
        OR: isNumericId
          ? [{ id: asNumber }, { slug: String(raw) }]
          : [{ slug: String(raw) }],
      },
      include: {
        stock: true,
        category: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
            nameAr: true,
          },
        },
        reviews: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!productRaw) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const relatedRaw = await prisma.product.findMany({
      where: {
        categoryId: productRaw.categoryId,
        active: true,
        NOT: { id: productRaw.id },
      },
      take: 4,
      include: {
        stock: true,
      },
    });

    const product = attachComputedPrice(productRaw);
    const related = relatedRaw.map(attachComputedPrice);

    return NextResponse.json({
      success: true,
      data: { ...product, related },
    });
  } catch (error) {
    console.error("GET /api/products/id/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
