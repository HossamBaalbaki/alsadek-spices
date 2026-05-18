import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

// ─── GET SINGLE STOCK ───────────────────────────
export async function GET(request, context) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const stock = await prisma.stock.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
        restocks: { orderBy: { createdAt: "desc" } },
        products: {
          select: { id: true, nameEn: true, nameAr: true, slug: true, active: true },
        },
      },
    });

    if (!stock) {
      return NextResponse.json(
        { success: false, message: "Stock not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: stock });
  } catch (error) {
    console.error("GET /api/admin/stock/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}

// ─── UPDATE STOCK (info only, not quantity) ───────────────────────────
// Quantity changes must go through /restock endpoint.
export async function PUT(request, context) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const allowed = {};
    if (body.nameEn !== undefined) allowed.nameEn = body.nameEn;
    if (body.nameAr !== undefined) allowed.nameAr = body.nameAr;
    if (body.descriptionEn !== undefined)
      allowed.descriptionEn = body.descriptionEn || null;
    if (body.descriptionAr !== undefined)
      allowed.descriptionAr = body.descriptionAr || null;
    if (body.images !== undefined)
      allowed.images = Array.isArray(body.images) ? body.images : [];
    if (body.categoryId !== undefined)
      allowed.categoryId = body.categoryId ? Number(body.categoryId) : null;
    if (body.lowStockThresholdGrams !== undefined) {
      const val = Number(body.lowStockThresholdGrams);
      allowed.lowStockThresholdGrams = val > 0 ? val : 500;
    }
    if (body.active !== undefined) allowed.active = Boolean(body.active);

    const stock = await prisma.stock.update({
      where: { id: parseInt(id) },
      data: allowed,
      include: {
        category: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
      },
    });

    if (allowed.images !== undefined) {
      await prisma.product.updateMany({
        where: { stockId: parseInt(id) },
        data: { images: allowed.images },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Stock updated",
      data: stock,
    });
  } catch (error) {
    console.error("PUT /api/admin/stock/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update stock" },
      { status: 500 }
    );
  }
}

// ─── DELETE STOCK ───────────────────────────
export async function DELETE(request, context) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const stockId = parseInt(id);

    // Block deletion if linked to any product or bundle item
    const [productCount, bundleCount] = await Promise.all([
      prisma.product.count({ where: { stockId } }),
      prisma.bundleItem.count({ where: { stockId } }),
    ]);

    if (productCount > 0 || bundleCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete: this stock is linked to ${productCount} product(s) and ${bundleCount} bundle item(s). Unlink them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.stock.delete({ where: { id: stockId } });

    return NextResponse.json({ success: true, message: "Stock deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/stock/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete stock" },
      { status: 500 }
    );
  }
}
