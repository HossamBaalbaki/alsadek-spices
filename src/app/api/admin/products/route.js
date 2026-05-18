import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";
import {
  validateVariantPricesAgainstCost,
  validateBundleSaleAgainstCost,
  parseWeightLabelToGrams,
  computeMarkupPercent,
} from "@/lib/stock";

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

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("GET admin products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

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
      slug,
      images,
      type,
      price,
      originalPrice,
      stockId,
      categoryId,
      variants,
      bundleItems,
      labels,
      featured,
      bestSeller,
      active,
    } = body;

    if (!slug || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Slug and category are required" },
        { status: 400 }
      );
    }

    const productType = type || "single";
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Slug already exists" },
        { status: 400 }
      );
    }

    if (productType === "single") {
      if (!stockId) {
        return NextResponse.json(
          { success: false, message: "Stock is required for single product" },
          { status: 400 }
        );
      }

      const stock = await prisma.stock.findUnique({
        where: { id: Number(stockId) },
      });
      if (!stock) {
        return NextResponse.json(
          { success: false, message: "Selected stock not found" },
          { status: 404 }
        );
      }

      const normalizedVariants = normalizeVariants(variants);
      if (normalizedVariants.length === 0) {
        return NextResponse.json(
          { success: false, message: "At least one valid variant is required" },
          { status: 400 }
        );
      }

      const variantCheck = validateVariantPricesAgainstCost({
        variants: normalizedVariants,
        costPerGram: stock.costPerGram,
        salePercent: labels?.salePercent || 0,
      });
      if (!variantCheck.ok) {
        return NextResponse.json(
          { success: false, message: variantCheck.message },
          { status: 400 }
        );
      }

      const product = await prisma.product.create({
        data: {
          nameEn: stock.nameEn,
          nameAr: stock.nameAr,
          descriptionEn: stock.descriptionEn || null,
          descriptionAr: stock.descriptionAr || null,
          slug,
          images: Array.isArray(images) && images.length ? images : stock.images || [],
          type: "single",
          price: null,
          originalPrice: null,
          stockId: Number(stockId),
          categoryId: Number(categoryId),
          variants: normalizedVariants,
          labels: labels || undefined,
          featured: featured || false,
          bestSeller: bestSeller || false,
          active: active !== undefined ? active : true,
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
          bundleItems: true,
        },
      });

      // Learn the markup from accepted variant prices
      const markup = computeMarkupPercent(normalizedVariants, stock.costPerGram);
      await prisma.pricingRule.upsert({
        where: { stockId: Number(stockId) },
        update: { markupPercent: markup },
        create: { stockId: Number(stockId), markupPercent: markup },
      });

      return NextResponse.json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    }

    // Bundle type
    const bundleList = Array.isArray(bundleItems) ? bundleItems : [];
    if (!Number(price) || Number(price) <= 0) {
      return NextResponse.json(
        { success: false, message: "Bundle price is required and must be > 0" },
        { status: 400 }
      );
    }
    if (bundleList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Bundle must include at least one stock item",
        },
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
      sellPrice: Number(price),
      bundleCost,
      salePercent: labels?.salePercent || 0,
    });
    if (!saleCheck.ok) {
      return NextResponse.json(
        { success: false, message: saleCheck.message },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        nameEn: nameEn || "Bundle Product",
        nameAr: nameAr || "منتج باقة",
        descriptionEn: descriptionEn || null,
        descriptionAr: descriptionAr || null,
        slug,
        images: Array.isArray(images) ? images : [],
        type: "bundle",
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : Number(price),
        stockId: null,
        categoryId: Number(categoryId),
        labels: labels || undefined,
        featured: featured || false,
        bestSeller: bestSeller || false,
        active: active !== undefined ? active : true,
        bundleItems: {
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
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("POST admin products error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
