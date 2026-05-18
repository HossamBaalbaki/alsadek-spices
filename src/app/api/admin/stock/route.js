import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base, excludeId = null) {
  let slug = slugify(base);
  let attempt = 0;
  while (true) {
    const existing = await prisma.stock.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    attempt++;
    slug = `${slugify(base)}-${attempt}`;
  }
}

// ─── LIST STOCK ───────────────────────────
export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lowOnly = searchParams.get("low") === "true";
    const type = searchParams.get("type"); // "single" | "bundle"

    const where = {};
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
      ];
    }
    if (type) where.type = type;

    const stocks = await prisma.stock.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        _count: { select: { restocks: true, inBundles: true } },
      },
    });

    const filtered = lowOnly
      ? stocks.filter((s) => s.currentStockPcs <= s.lowStockThresholdPcs)
      : stocks;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error("GET /api/admin/stock error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch stock" }, { status: 500 });
  }
}

// ─── CREATE STOCK ───────────────────────────
export async function POST(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nameEn, nameAr, descriptionEn, descriptionAr,
      images, categoryId, active,
      type = "single",
      currentStockPcs, lowStockThresholdPcs,
      variants, labels, featured, bestSeller,
      price, originalPrice,
      bundleItems, // [{ stockId, quantity }] for bundles
    } = body;

    if (!nameEn || !nameAr) {
      return NextResponse.json({ success: false, message: "Name (EN/AR) is required" }, { status: 400 });
    }

    const slug = await uniqueSlug(nameEn);

    const data = {
      slug,
      nameEn,
      nameAr,
      descriptionEn: descriptionEn || null,
      descriptionAr: descriptionAr || null,
      images: Array.isArray(images) ? images : [],
      categoryId: categoryId ? Number(categoryId) : null,
      type,
      active: active !== undefined ? Boolean(active) : true,
      currentStockPcs: Number(currentStockPcs) >= 0 ? Number(currentStockPcs) : 0,
      lowStockThresholdPcs: Number(lowStockThresholdPcs) > 0 ? Number(lowStockThresholdPcs) : 5,
      variants: Array.isArray(variants) ? variants : undefined,
      labels: labels || undefined,
      featured: Boolean(featured),
      bestSeller: Boolean(bestSeller),
      price: price ? Number(price) : undefined,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
    };

    // Add initial restock record if pcs > 0
    if (data.currentStockPcs > 0) {
      data.restocks = { create: { addedPcs: data.currentStockPcs } };
    }

    // Add bundle contents
    if (type === "bundle" && Array.isArray(bundleItems) && bundleItems.length > 0) {
      data.bundleContents = {
        create: bundleItems.map((item) => ({
          stockId: Number(item.stockId),
          quantity: Number(item.quantity) || 1,
        })),
      };
    }

    const stock = await prisma.stock.create({
      data,
      include: {
        category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
        bundleContents: { include: { stock: { select: { id: true, nameEn: true, nameAr: true } } } },
      },
    });

    return NextResponse.json({ success: true, message: "Stock created successfully", data: stock });
  } catch (error) {
    console.error("POST /api/admin/stock error:", error);
    return NextResponse.json({ success: false, message: "Failed to create stock" }, { status: 500 });
  }
}
