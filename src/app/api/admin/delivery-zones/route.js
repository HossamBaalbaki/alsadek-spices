import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const auth = verifyAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const zones = await prisma.deliveryZone.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: zones,
    });
  } catch (error) {
    console.error("GET /api/admin/delivery-zones error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch delivery zones" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = verifyAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      nameEn,
      nameAr,
      price,
      estimatedTime,
      estimatedTimeAr,
      sortOrder,
      active,
    } = body;

    if (!nameEn || !nameAr) {
      return NextResponse.json(
        { success: false, message: "Zone names are required" },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    const maxSort = await prisma.deliveryZone.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const zone = await prisma.deliveryZone.create({
      data: {
        nameEn: String(nameEn).trim(),
        nameAr: String(nameAr).trim(),
        price: parsedPrice,
        estimatedTime: String(estimatedTime || "").trim() || "30-60 min",
        estimatedTimeAr: String(estimatedTimeAr || "").trim() || "30-60 دقيقة",
        sortOrder:
          Number.isFinite(Number(sortOrder)) && Number(sortOrder) >= 0
            ? Number(sortOrder)
            : (maxSort?.sortOrder || 0) + 1,
        active: typeof active === "boolean" ? active : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Delivery zone created",
      data: zone,
    });
  } catch (error) {
    console.error("POST /api/admin/delivery-zones error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create delivery zone" },
      { status: 500 }
    );
  }
}
