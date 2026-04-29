import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

const DEDUCT_STATUSES = new Set([
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
]);

// ─── GET SINGLE ORDER (admin only) ───────────────────────────
export async function GET(request, context) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const { id } = await context.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: parseInt(id) || 0 },
          { orderNumber: id },
        ],
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// ─── UPDATE ORDER STATUS (admin only) ───────────────────────────
export async function PATCH(request, context) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const orderId = parseInt(id);
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                stock: true,
                bundleItems: {
                  include: { stock: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const prevStatus = existingOrder.status;
    const nextStatus = status || prevStatus;

    const wasDeducted = DEDUCT_STATUSES.has(prevStatus);
    const shouldDeduct = DEDUCT_STATUSES.has(nextStatus);

    const applyDeduction = !wasDeducted && shouldDeduct;
    const applyRestore = wasDeducted && nextStatus === "cancelled";

    const stockMoves = [];

    if (applyDeduction || applyRestore) {
      for (const item of existingOrder.items) {
        const qty = Number(item.quantity) || 1;

        if (item.type === "bundle") {
          const bundleItems = Array.isArray(item.product?.bundleItems)
            ? item.product.bundleItems
            : [];

          for (const bi of bundleItems) {
            const grams = (Number(bi.gramsPerUnit) || 0) * qty;
            if (grams > 0 && bi.stockId) {
              stockMoves.push({
                stockId: bi.stockId,
                grams,
              });
            }
          }
        } else {
          const gramsPerUnit =
            Number(item.grams) > 0
              ? Number(item.grams)
              : Number(item.product?.variants?.[0]?.grams || 0);
          const grams = gramsPerUnit * qty;

          if (grams > 0 && item.product?.stock?.id) {
            stockMoves.push({
              stockId: item.product.stock.id,
              grams,
            });
          }
        }
      }
    }

    const mergedMoves = Object.values(
      stockMoves.reduce((acc, m) => {
        if (!acc[m.stockId]) acc[m.stockId] = { stockId: m.stockId, grams: 0 };
        acc[m.stockId].grams += m.grams;
        return acc;
      }, {})
    );

    const order = await prisma.$transaction(async (tx) => {
      if (applyDeduction) {
        for (const m of mergedMoves) {
          const st = await tx.stock.findUnique({
            where: { id: m.stockId },
            select: { currentStockGrams: true },
          });
          const current = Number(st?.currentStockGrams) || 0;
          if (current < m.grams) {
            throw new Error("INSUFFICIENT_STOCK_CONFIRM");
          }
          await tx.stock.update({
            where: { id: m.stockId },
            data: {
              currentStockGrams: { decrement: m.grams },
            },
          });
        }
      }

      if (applyRestore) {
        for (const m of mergedMoves) {
          await tx.stock.update({
            where: { id: m.stockId },
            data: {
              currentStockGrams: { increment: m.grams },
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
          ...(nextStatus === "cancelled" ? { stockRestored: true } : {}),
        },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);

    if (String(error?.message || "").includes("INSUFFICIENT_STOCK_CONFIRM")) {
      return NextResponse.json(
        { success: false, message: "Insufficient stock to confirm this order" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}