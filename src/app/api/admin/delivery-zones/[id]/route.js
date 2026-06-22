import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function DELETE(request, context) {
  try {
    const auth = verifyAdmin(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const zoneId = Number(id);
    if (!Number.isInteger(zoneId) || zoneId <= 0) {
      return NextResponse.json({ success: false, message: "Invalid delivery zone id" }, { status: 400 });
    }

    await prisma.deliveryZone.delete({ where: { id: zoneId } });
    return NextResponse.json({ success: true, message: "Delivery zone deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/delivery-zones/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete delivery zone" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const auth = verifyAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const zoneId = Number(id);

    if (!Number.isInteger(zoneId) || zoneId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid delivery zone id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const data = {};
    if (body.nameEn !== undefined) data.nameEn = String(body.nameEn || "").trim();
    if (body.nameAr !== undefined) data.nameAr = String(body.nameAr || "").trim();
    if (body.estimatedTime !== undefined) data.estimatedTime = String(body.estimatedTime || "").trim();
    if (body.estimatedTimeAr !== undefined) data.estimatedTimeAr = String(body.estimatedTimeAr || "").trim();
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.active !== undefined) data.active = Boolean(body.active);

    if (data.price !== undefined && (!Number.isFinite(data.price) || data.price < 0)) {
      return NextResponse.json(
        { success: false, message: "Price must be >= 0" },
        { status: 400 }
      );
    }

    if (
      data.sortOrder !== undefined &&
      (!Number.isFinite(data.sortOrder) || data.sortOrder < 0)
    ) {
      return NextResponse.json(
        { success: false, message: "Sort order must be >= 0" },
        { status: 400 }
      );
    }

    const updated = await prisma.deliveryZone.update({
      where: { id: zoneId },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Delivery zone updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/admin/delivery-zones/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update delivery zone" },
      { status: 500 }
    );
  }
}
