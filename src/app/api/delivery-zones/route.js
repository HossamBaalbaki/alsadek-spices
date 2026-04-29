import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET ALL DELIVERY ZONES ───────────────────────────
export async function GET(request) {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: zones,
    });
  } catch (error) {
    console.error("GET /api/delivery-zones error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch delivery zones" },
      { status: 500 }
    );
  }
}