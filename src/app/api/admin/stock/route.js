import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";
import { unitToGrams, computeCostPerGram } from "@/lib/stock";

// ─── LIST STOCK ───────────────────────────
export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lowOnly = searchParams.get("low") === "true";

    const where = {};
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
      ];
    }

    const stocks = await prisma.stock.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
        _count: { select: { restocks: true, products: true, bundleItems: true } },
      },
    });

    const filtered = lowOnly
      ? stocks.filter(
          (s) => Number(s.currentStockGrams) <= Number(s.lowStockThresholdGrams)
        )
      : stocks;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error("GET /api/admin/stock error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}

// ─── CREATE STOCK ───────────────────────────
export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      images,
      categoryId,
      purchaseUnit,
      purchaseQuantity,
      purchasePrice,
      sellPricePerGram,
      lowStockThresholdGrams,
      active,
    } = body;

    // Validation
    if (!nameEn || !nameAr) {
      return NextResponse.json(
        { success: false, message: "Name (EN/AR) is required" },
        { status: 400 }
      );
    }
    if (!["gram", "kilogram", "ton"].includes(purchaseUnit)) {
      return NextResponse.json(
        { success: false, message: "Invalid purchase unit" },
        { status: 400 }
      );
    }
    const qty = Number(purchaseQuantity);
    const price = Number(purchasePrice);
    const sellPerG = Number(sellPricePerGram);
    if (!qty || qty <= 0) {
      return NextResponse.json(
        { success: false, message: "Purchase quantity must be > 0" },
        { status: 400 }
      );
    }
    if (!price || price <= 0) {
      return NextResponse.json(
        { success: false, message: "Purchase price must be > 0" },
        { status: 400 }
      );
    }
    if (!sellPerG || sellPerG <= 0) {
      return NextResponse.json(
        { success: false, message: "Sell price per gram must be > 0" },
        { status: 400 }
      );
    }

    const totalGrams = unitToGrams(qty, purchaseUnit);
    const costPerGram = computeCostPerGram(price, qty, purchaseUnit);

    if (sellPerG < costPerGram) {
      return NextResponse.json(
        {
          success: false,
          message: `Sell price per gram (${sellPerG}) cannot be below cost per gram (${costPerGram.toFixed(
            4
          )})`,
        },
        { status: 400 }
      );
    }

    const stock = await prisma.stock.create({
      data: {
        nameEn,
        nameAr,
        descriptionEn: descriptionEn || null,
        descriptionAr: descriptionAr || null,
        images: Array.isArray(images) ? images : [],
        categoryId: categoryId ? Number(categoryId) : null,
        purchaseUnit,
        purchaseQuantity: qty,
        purchasePrice: price,
        costPerGram,
        sellPricePerGram: sellPerG,
        currentStockGrams: totalGrams,
        totalStockGrams: totalGrams,
        lowStockThresholdGrams:
          Number(lowStockThresholdGrams) > 0 ? Number(lowStockThresholdGrams) : 500,
        active: active !== undefined ? Boolean(active) : true,
        restocks: {
          create: {
            addedGrams: totalGrams,
            purchasePrice: price,
            purchaseUnit,
            purchaseQty: qty,
          },
        },
      },
      include: {
        category: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stock created successfully",
      data: stock,
    });
  } catch (error) {
    console.error("POST /api/admin/stock error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create stock" },
      { status: 500 }
    );
  }
}
