import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

// ─── GET SINGLE STOCK ───────────────────────────
export async function GET(request, context) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const stock = await prisma.stock.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        restocks: { orderBy: { createdAt: "desc" } },
        bundleContents: {
          include: { stock: { select: { id: true, nameEn: true, nameAr: true, images: true } } },
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ success: false, message: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: stock });
  } catch (error) {
    console.error("GET /api/admin/stock/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch stock" }, { status: 500 });
  }
}

// ─── UPDATE STOCK ───────────────────────────
export async function PUT(request, context) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const stockId = parseInt(id);
    const body = await request.json();

    const allowed = {};
    if (body.nameEn !== undefined) allowed.nameEn = body.nameEn;
    if (body.nameAr !== undefined) allowed.nameAr = body.nameAr;
    if (body.descriptionEn !== undefined) allowed.descriptionEn = body.descriptionEn || null;
    if (body.descriptionAr !== undefined) allowed.descriptionAr = body.descriptionAr || null;
    if (body.images !== undefined) allowed.images = Array.isArray(body.images) ? body.images : [];
    if (body.categoryId !== undefined) allowed.categoryId = body.categoryId ? Number(body.categoryId) : null;
    if (body.active !== undefined) allowed.active = Boolean(body.active);
    if (body.featured !== undefined) allowed.featured = Boolean(body.featured);
    if (body.bestSeller !== undefined) allowed.bestSeller = Boolean(body.bestSeller);
    if (body.variants !== undefined) allowed.variants = Array.isArray(body.variants) ? body.variants : [];
    if (body.labels !== undefined) allowed.labels = body.labels;
    if (body.lowStockThresholdPcs !== undefined) {
      const val = Number(body.lowStockThresholdPcs);
      allowed.lowStockThresholdPcs = val > 0 ? val : 5;
    }
    if (body.price !== undefined) allowed.price = body.price ? Number(body.price) : null;
    if (body.originalPrice !== undefined) allowed.originalPrice = body.originalPrice ? Number(body.originalPrice) : null;

    const stock = await prisma.stock.update({
      where: { id: stockId },
      data: allowed,
      include: {
        category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        bundleContents: {
          include: { stock: { select: { id: true, nameEn: true, nameAr: true, images: true } } },
        },
      },
    });

    // If bundle items are being updated, replace them
    if (body.bundleItems !== undefined && Array.isArray(body.bundleItems)) {
      await prisma.bundleItem.deleteMany({ where: { bundleStockId: stockId } });
      if (body.bundleItems.length > 0) {
        await prisma.bundleItem.createMany({
          data: body.bundleItems.map((item) => ({
            bundleStockId: stockId,
            stockId: Number(item.stockId),
            quantity: Number(item.quantity) || 1,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, message: "Stock updated", data: stock });
  } catch (error) {
    console.error("PUT /api/admin/stock/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update stock" }, { status: 500 });
  }
}

// ─── DELETE STOCK ───────────────────────────
export async function DELETE(request, context) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const stockId = parseInt(id);

    const inBundlesCount = await prisma.bundleItem.count({ where: { stockId } });
    if (inBundlesCount > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete: this stock is used in ${inBundlesCount} bundle(s). Remove it from those bundles first.` },
        { status: 400 }
      );
    }

    await prisma.stock.delete({ where: { id: stockId } });
    return NextResponse.json({ success: true, message: "Stock deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/stock/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete stock" }, { status: 500 });
  }
}
