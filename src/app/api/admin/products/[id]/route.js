import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import {
  validateVariantPricesAgainstCost,
  validateBundleSaleAgainstCost,
  parseWeightLabelToGrams,
  computeMarkupPercent,
} from "@/lib/stock";

const verifyToken = (request) => {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(
      auth.split(" ")[1],
      process.env.NEXTAUTH_SECRET || "alsadeksecret2026"
    );
  } catch {
    return null;
  }
};

const normalizeVariants = (variants) => {
  const list = Array.isArray(variants) ? variants : [];
  return list
    .map((v) => {
      const weightLabel = String(v.weightLabel || v.weight || "").trim();
      const grams = Number(v.grams) || parseWeightLabelToGrams(weightLabel);
      const price = Number(v.price) || 0;
      return { weightLabel, grams, price };
    })
    .filter((v) => v.weightLabel && v.grams > 0 && v.price > 0);
};

// ─── GET SINGLE PRODUCT ───────────────────────────
export async function GET(request, context) {
  try {
    const admin = verifyToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const numericId = Number(id);

    if (!numericId || isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product id" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: numericId },
      include: {
        category: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
        stock: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            costPerGram: true,
            currentStockGrams: true,
          },
        },
        bundleItems: {
          include: {
            stock: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true,
                costPerGram: true,
                currentStockGrams: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// ─── UPDATE PRODUCT (FULL) ───────────────────────────
export async function PUT(request, context) {
  try {
    const admin = verifyToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();

    const current = await prisma.product.findUnique({
      where: { id: numericId },
      include: { bundleItems: true },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const productType = body.type || current.type || "single";

    if (!body.slug || !body.categoryId) {
      return NextResponse.json(
        { success: false, message: "Slug and category are required" },
        { status: 400 }
      );
    }

    if (productType === "single") {
      if (!body.stockId) {
        return NextResponse.json(
          { success: false, message: "Stock is required for single product" },
          { status: 400 }
        );
      }

      const stock = await prisma.stock.findUnique({
        where: { id: Number(body.stockId) },
      });
      if (!stock) {
        return NextResponse.json(
          { success: false, message: "Selected stock not found" },
          { status: 404 }
        );
      }

      const normalizedVariants = normalizeVariants(body.variants);
      if (normalizedVariants.length === 0) {
        return NextResponse.json(
          { success: false, message: "At least one valid variant is required" },
          { status: 400 }
        );
      }

      const variantCheck = validateVariantPricesAgainstCost({
        variants: normalizedVariants,
        costPerGram: stock.costPerGram,
        salePercent: body.labels?.salePercent || 0,
      });
      if (!variantCheck.ok) {
        return NextResponse.json(
          { success: false, message: variantCheck.message },
          { status: 400 }
        );
      }

      const product = await prisma.product.update({
        where: { id: numericId },
        data: {
          nameEn: stock.nameEn,
          nameAr: stock.nameAr,
          descriptionEn: stock.descriptionEn || null,
          descriptionAr: stock.descriptionAr || null,
          slug: body.slug,
          images:
            Array.isArray(body.images) && body.images.length
              ? body.images
              : stock.images || [],
          type: "single",
          price: null,
          originalPrice: null,
          stockId: Number(body.stockId),
          categoryId: Number(body.categoryId),
          variants: normalizedVariants,
          labels: body.labels ?? undefined,
          featured: body.featured || false,
          bestSeller: body.bestSeller || false,
          active: body.active !== undefined ? body.active : true,
          bundleItems: {
            deleteMany: {},
          },
        },
        include: {
          category: {
            select: { id: true, slug: true, nameEn: true, nameAr: true },
          },
          stock: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
              costPerGram: true,
              currentStockGrams: true,
            },
          },
          bundleItems: {
            include: {
              stock: {
                select: {
                  id: true,
                  nameEn: true,
                  nameAr: true,
                  costPerGram: true,
                  currentStockGrams: true,
                },
              },
            },
          },
        },
      });

      // Learn the markup from accepted variant prices
      const markup = computeMarkupPercent(normalizedVariants, stock.costPerGram);
      await prisma.pricingRule.upsert({
        where: { stockId: Number(body.stockId) },
        update: { markupPercent: markup },
        create: { stockId: Number(body.stockId), markupPercent: markup },
      });

      return NextResponse.json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    }

    const bundleList = Array.isArray(body.bundleItems) ? body.bundleItems : [];
    if (!Number(body.price) || Number(body.price) <= 0) {
      return NextResponse.json(
        { success: false, message: "Bundle price must be > 0" },
        { status: 400 }
      );
    }
    if (bundleList.length === 0) {
      return NextResponse.json(
        { success: false, message: "Bundle must include at least one stock item" },
        { status: 400 }
      );
    }

    const parsedBundle = bundleList
      .map((b) => ({
        stockId: Number(b.stockId),
        gramsPerUnit: Number(b.gramsPerUnit),
      }))
      .filter((b) => b.stockId > 0 && b.gramsPerUnit > 0);

    if (parsedBundle.length === 0) {
      return NextResponse.json(
        { success: false, message: "Bundle items are invalid" },
        { status: 400 }
      );
    }

    const stockIds = [...new Set(parsedBundle.map((b) => b.stockId))];
    const stocks = await prisma.stock.findMany({
      where: { id: { in: stockIds } },
      select: { id: true, costPerGram: true },
    });
    if (stocks.length !== stockIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more bundle stock items not found" },
        { status: 404 }
      );
    }

    const stockCostMap = new Map(stocks.map((s) => [s.id, Number(s.costPerGram) || 0]));
    const bundleCost = parsedBundle.reduce(
      (sum, item) => sum + item.gramsPerUnit * (stockCostMap.get(item.stockId) || 0),
      0
    );

    const saleCheck = validateBundleSaleAgainstCost({
      sellPrice: Number(body.price),
      bundleCost,
      salePercent: body.labels?.salePercent || 0,
    });
    if (!saleCheck.ok) {
      return NextResponse.json(
        { success: false, message: saleCheck.message },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: numericId },
      data: {
        nameEn: body.nameEn || current.nameEn || "Bundle Product",
        nameAr: body.nameAr || current.nameAr || "منتج باقة",
        descriptionEn: body.descriptionEn || null,
        descriptionAr: body.descriptionAr || null,
        slug: body.slug,
        images: Array.isArray(body.images) ? body.images : [],
        type: "bundle",
        price: Number(body.price),
        originalPrice: body.originalPrice
          ? Number(body.originalPrice)
          : Number(body.price),
        stockId: null,
        categoryId: Number(body.categoryId),
        labels: body.labels ?? undefined,
        featured: body.featured || false,
        bestSeller: body.bestSeller || false,
        active: body.active !== undefined ? body.active : true,
        bundleItems: {
          deleteMany: {},
          create: parsedBundle.map((item) => ({
            stockId: item.stockId,
            gramsPerUnit: item.gramsPerUnit,
          })),
        },
      },
      include: {
        category: {
          select: { id: true, slug: true, nameEn: true, nameAr: true },
        },
        stock: true,
        bundleItems: {
          include: {
            stock: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true,
                costPerGram: true,
                currentStockGrams: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// ─── PATCH PRODUCT (PARTIAL) ───────────────────────────
export async function PATCH(request, context) {
  try {
    const admin = verifyToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();

    const product = await prisma.product.update({
      where: { id: numericId },
      data: body,
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

// ─── DELETE PRODUCT ───────────────────────────
export async function DELETE(request, context) {
  try {
    const admin = verifyToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const numericId = Number(id);

    await prisma.product.delete({
      where: { id: numericId },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
