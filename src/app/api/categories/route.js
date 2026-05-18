import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET ALL CATEGORIES ───────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where = {};
    if (active === "true") {
      where.active = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
    });

    const formatted = categories.map((cat) => ({
      ...cat,
      productCount: cat._count.products,
      _count: undefined,
    }));

    return NextResponse.json(
      { success: true, data: formatted },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}