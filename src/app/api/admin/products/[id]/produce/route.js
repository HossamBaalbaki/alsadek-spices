import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

export async function POST(request, context) {
  if (!verifyAdmin(request)) return unauthorized();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();
    const quantity = Math.floor(Number(body.quantity));

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, message: "Quantity must be a positive integer" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: numericId },
      include: {
        bundleItems: {
          include: {
            stock: {
              select: { id: true, nameEn: true, currentStockGrams: true },
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

    if (product.type !== "bundle") {
      return NextResponse.json(
        { success: false, message: "Only bundle products can be produced" },
        { status: 400 }
      );
    }

    if (!product.bundleItems || product.bundleItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "Bundle has no recipe items" },
        { status: 400 }
      );
    }

    // Check raw material availability
    for (const bi of product.bundleItems) {
      const needed = Number(bi.gramsPerUnit) * quantity;
      const available = Number(bi.stock?.currentStockGrams) || 0;
      if (available < needed) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient raw stock: "${bi.stock?.nameEn || `Stock #${bi.stockId}`}" needs ${needed.toFixed(0)}g but only ${available.toFixed(0)}g available`,
          },
          { status: 409 }
        );
      }
    }

    // Deduct raw materials, increment bundleStock
    const updated = await prisma.$transaction(async (tx) => {
      for (const bi of product.bundleItems) {
        const deductGrams = Number(bi.gramsPerUnit) * quantity;
        await tx.stock.update({
          where: { id: bi.stockId },
          data: { currentStockGrams: { decrement: deductGrams } },
        });
      }

      return tx.product.update({
        where: { id: numericId },
        data: { bundleStock: { increment: quantity } },
        select: { id: true, nameEn: true, nameAr: true, bundleStock: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Produced ${quantity} unit(s). New finished stock: ${updated.bundleStock}`,
      data: updated,
    });
  } catch (error) {
    console.error("POST /api/admin/products/[id]/produce error:", error);
    return NextResponse.json(
      { success: false, message: "Production failed" },
      { status: 500 }
    );
  }
}
