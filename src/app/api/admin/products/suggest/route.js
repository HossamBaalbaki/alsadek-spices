import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

// GET /api/admin/products/suggest?stockId=X&grams=Y
// Returns suggested price for a variant based on learned markup
export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stockId = Number(searchParams.get("stockId"));
    const grams = Number(searchParams.get("grams"));

    if (!stockId || !grams || grams <= 0) {
      return NextResponse.json({ success: false, message: "stockId and grams required" }, { status: 400 });
    }

    const [stock, rule] = await Promise.all([
      prisma.stock.findUnique({ where: { id: stockId }, select: { costPerGram: true } }),
      prisma.pricingRule.findUnique({ where: { stockId }, select: { markupPercent: true } }),
    ]);

    if (!stock) {
      return NextResponse.json({ success: false, message: "Stock not found" }, { status: 404 });
    }

    const costPerGram = Number(stock.costPerGram) || 0;
    const markupPercent = Number(rule?.markupPercent ?? 30);
    const costForVariant = costPerGram * grams;
    const suggestedPrice = Math.round(costForVariant * (1 + markupPercent / 100) * 100) / 100;

    return NextResponse.json({
      success: true,
      data: { suggestedPrice, markupPercent, costForVariant: Math.round(costForVariant * 100) / 100 },
    });
  } catch (error) {
    console.error("GET /api/admin/products/suggest error:", error);
    return NextResponse.json({ success: false, message: "Failed" }, { status: 500 });
  }
}
