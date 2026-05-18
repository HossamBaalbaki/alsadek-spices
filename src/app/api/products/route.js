import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function firstPrice(stock) {
  if (stock.type === "bundle") return Number(stock.price || 0);
  const variants = Array.isArray(stock.variants) ? stock.variants : [];
  return Number(variants[0]?.price || 0);
}

function applyStockSale(stock) {
  const labels = stock.labels || {};
  const salePct = labels.isSale && Number(labels.salePercent) > 0 ? Number(labels.salePercent) : 0;
  if (!salePct || stock.type !== "single") return stock;

  const variants = Array.isArray(stock.variants) ? stock.variants : [];
  return {
    ...stock,
    variants: variants.map((v) => {
      const base = Number(v.price) || 0;
      return {
        ...v,
        price: Math.round(base * (1 - salePct / 100) * 100) / 100,
        originalPrice: base,
      };
    }),
  };
}

// ─── GET ALL PRODUCTS (reads from Stock) ───────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured");
    const bestSeller = searchParams.get("bestSeller");
    const type = searchParams.get("type");
    const labels = searchParams.getAll("label");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where = { active: true, slug: { not: null } };
    if (category && category !== "all") where.category = { slug: category };
    if (type && type !== "all") where.type = type;
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
        { descriptionEn: { contains: search, mode: "insensitive" } },
      ];
    }
    if (labels.length > 0) {
      where.AND = labels.map((label) => ({ labels: { path: [label], equals: true } }));
    }
    if (featured === "true") where.featured = true;
    if (bestSeller === "true") where.bestSeller = true;

    const dbSort =
      sort === "best-selling" ? { reviewCount: "desc" }
      : sort === "rating" ? { rating: "desc" }
      : { createdAt: "desc" };

    const [rawStocks, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        orderBy: dbSort,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        },
      }),
      prisma.stock.count({ where }),
    ]);

    let stocks = rawStocks.map((s) => ({
      ...applyStockSale(s),
      soldOut: s.currentStockPcs <= 0,
      price: firstPrice(s),
    }));

    if (sort === "price-low-high") stocks.sort((a, b) => firstPrice(a) - firstPrice(b));
    if (sort === "price-high-low") stocks.sort((a, b) => firstPrice(b) - firstPrice(a));

    return NextResponse.json(
      { success: true, data: stocks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to fetch products" }, { status: 500 });
  }
}
