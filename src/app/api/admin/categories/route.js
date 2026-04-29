import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET ALL CATEGORIES (admin: includes inactive) ───────────────────────
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        _count: { select: { products: true } },
      },
    });

    const formatted = categories.map((cat) => ({
      ...cat,
      productCount: cat._count.products,
      _count: undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// ─── CREATE NEW CATEGORY ───────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      slug,
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      image,
      icon,
      active,
      sortOrder,
    } = body;

    if (!slug || !nameEn || !nameAr) {
      return NextResponse.json(
        { success: false, message: "slug, nameEn and nameAr are required" },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const existing = await prisma.category.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        slug: cleanSlug,
        nameEn,
        nameAr,
        descriptionEn: descriptionEn || null,
        descriptionAr: descriptionAr || null,
        image: image || null,
        icon: icon || null,
        active: active !== undefined ? Boolean(active) : true,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
