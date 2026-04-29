import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichSingleVariants } from "@/lib/stock";

function attachComputedPrice(product) {
  if (!product) return product;

  if (product.type === "single") {
    const enriched = enrichSingleVariants({
      type: "single",
      variants: product.variants,
      labels: product.labels,
      stock: product.stock,
    });

    return {
      ...product,
      variants: enriched,
      price: Number(enriched[0]?.price || 0),
      soldOut: (Number(product.stock?.currentStockGrams) || 0) <= 0,
    };
  }

  return {
    ...product,
    price: Number(product.price || 0),
    soldOut: (Number(product.bundleStock) || 0) <= 0,
  };
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const slug = params.slug;

    const productRaw = await prisma.product.findFirst({
      where: { slug, active: true },
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
        bundleItems: {
          include: {
            stock: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true,
                currentStockGrams: true,
              },
            },
          },
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
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
