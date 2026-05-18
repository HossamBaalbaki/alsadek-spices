import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

// ─── RESTOCK ───────────────────────────
// Adds pieces to stock and logs a restock record.
export async function POST(request, context) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const stockId = parseInt(id);
    const body = await request.json();
    const { addedPcs, notes } = body;

    const pcs = Number(addedPcs);
    if (!pcs || pcs <= 0 || !Number.isInteger(pcs)) {
      return NextResponse.json(
        { success: false, message: "addedPcs must be a positive whole number" },
        { status: 400 }
      );
    }

    const existing = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Stock not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stockRestock.create({
        data: { stockId, addedPcs: pcs, notes: notes || null },
      });
      return tx.stock.update({
        where: { id: stockId },
        data: { currentStockPcs: { increment: pcs } },
        include: {
          category: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
          restocks: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
    });

    return NextResponse.json({ success: true, message: "Stock replenished", data: updated });
  } catch (error) {
    console.error("POST /api/admin/stock/[id]/restock error:", error);
    return NextResponse.json({ success: false, message: "Failed to restock" }, { status: 500 });
  }
}
