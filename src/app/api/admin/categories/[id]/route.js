import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

// ─── UPDATE CATEGORY ───────────────────────────
export async function PUT(request, { params }) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const { id } = await params;
    const categoryId = Number(id);
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Invalid category id" },
        { status: 400 }
      );
    }

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

    const data = {};
    if (slug !== undefined) {
      const cleanSlug = String(slug)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const conflict = await prisma.category.findFirst({
        where: { slug: cleanSlug, NOT: { id: categoryId } },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, message: "A category with this slug already exists" },
          { status: 409 }
        );
      }
      data.slug = cleanSlug;
    }
    if (nameEn !== undefined) data.nameEn = nameEn;
    if (nameAr !== undefined) data.nameAr = nameAr;
    if (descriptionEn !== undefined) data.descriptionEn = descriptionEn || null;
    if (descriptionAr !== undefined) data.descriptionAr = descriptionAr || null;
    if (image !== undefined) data.image = image || null;
    if (icon !== undefined) data.icon = icon || null;
    if (active !== undefined) data.active = Boolean(active);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// ─── DELETE CATEGORY ───────────────────────────
export async function DELETE(request, { params }) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const { id } = await params;
    const categoryId = Number(id);
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Invalid category id" },
        { status: 400 }
      );
    }

    const productCount = await prisma.product.count({
      where: { categoryId },
    });
    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category: ${productCount} product(s) still belong to it. Move or delete them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}

