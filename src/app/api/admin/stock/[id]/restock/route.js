import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";
import {
  unitToGrams,
  computeCostPerGram,
  weightedAvgCostPerGram,
} from "@/lib/stock";

// ─── RESTOCK ───────────────────────────
// Adds grams + logs a restock batch. Recomputes weighted-average cost per gram.
export async function POST(request, context) {
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
    const body = await request.json();
    const { purchaseUnit, purchaseQuantity, purchasePrice } = body;

    if (!["gram", "kilogram", "ton"].includes(purchaseUnit)) {
      return NextResponse.json(
        { success: false, message: "Invalid purchase unit" },
        { status: 400 }
      );
    }
    const qty = Number(purchaseQuantity);
    const price = Number(purchasePrice);
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

    const existing = await prisma.stock.findUnique({
      where: { id: stockId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Stock not found" },
        { status: 404 }
      );
    }

    const addedGrams = unitToGrams(qty, purchaseUnit);
    const addedCostPerGram = computeCostPerGram(price, qty, purchaseUnit);
    const newCostPerGram = weightedAvgCostPerGram({
      existingGrams: existing.currentStockGrams,
      existingCostPerGram: existing.costPerGram,
      addedGrams,
      addedCostPerGram,
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stockRestock.create({
        data: {
          stockId,
          addedGrams,
          purchasePrice: price,
          purchaseUnit,
          purchaseQty: qty,
        },
      });
      return tx.stock.update({
        where: { id: stockId },
        data: {
          currentStockGrams: { increment: addedGrams },
          totalStockGrams: { increment: addedGrams },
          costPerGram: newCostPerGram,
          // Update latest-purchase display fields
          purchaseUnit,
          purchaseQuantity: qty,
          purchasePrice: price,
        },
        include: {
          category: {
            select: { id: true, slug: true, nameEn: true, nameAr: true },
          },
          restocks: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Stock replenished",
      data: updated,
    });
  } catch (error) {
    console.error("POST /api/admin/stock/[id]/restock error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to restock" },
      { status: 500 }
    );
  }
}
