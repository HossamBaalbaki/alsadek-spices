import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichSingleVariants } from "@/lib/stock";

function firstPrice(product) {
  if (product.type === "bundle") return Number(product.price || 0);
  const arr = Array.isArray(product.variants) ? product.variants : [];
  return Number(arr[0]?.price || 0);
}

// ─── GET ALL PRODUCTS ───────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured");
    const bestSeller = searchParams.get("bestSeller");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where = { active: true };

    if (category && category !== "all") where.category = { slug: category };

    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
        { descriptionEn: { contains: search, mode: "insensitive" } },
      ];
    }

    if (featured === "true") where.featured = true;
    if (bestSeller === "true") where.bestSeller = true;

    const dbSort = sort === "price-low-high" || sort === "price-high-low"
      ? { createdAt: "desc" }
      : sort === "best-selling"
      ? { reviewCount: "desc" }
      : sort === "rating"
      ? { rating: "desc" }
      : { createdAt: "desc" };

    const [rawProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: dbSort,
        skip,
        take: limit,
        include: {
          stock: true,
          category: {
            select: { id: true, slug: true, nameEn: true, nameAr: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const products = rawProducts.map((p) => {
      if (p.type === "single") {
        const enriched = enrichSingleVariants(p);
        return {
          ...p,
          variants: enriched,
          price: Number(enriched[0]?.price || 0),
          soldOut: (Number(p.stock?.currentStockGrams) || 0) <= 0,
        };
      }
      return {
        ...p,
        price: Number(p.price || 0),
        soldOut: (Number(p.bundleStock) || 0) <= 0,
      };
    });

    if (sort === "price-low-high") {
      products.sort((a, b) => firstPrice(a) - firstPrice(b));
    } else if (sort === "price-high-low") {
      products.sort((a, b) => firstPrice(b) - firstPrice(a));
    }

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
