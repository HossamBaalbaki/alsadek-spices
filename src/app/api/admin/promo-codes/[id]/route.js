import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";
import { rateLimit, getIP, tooManyRequests } from "@/lib/rateLimit";

// ─── UPDATE / TOGGLE PROMO CODE ──────────────────────────────────────────────
export async function PATCH(request, context) {
  if (!verifyAdmin(request)) return unauthorized();

  const ip = getIP(request);
  const rl = rateLimit(`promo-patch:${ip}`, { windowMs: 60_000, max: 30 });
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  const { id: rawId } = await context.params;
  const id = parseInt(rawId);

  try {
    const body = await request.json();
    const { code, type, value, minOrder, maxUses, expiresAt, active } = body;

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Promo code not found" }, { status: 404 });
    }

    const updateData = {};

    if (code !== undefined) {
      const normalized = code.toUpperCase().trim();
      if (normalized !== existing.code) {
        const conflict = await prisma.promoCode.findUnique({ where: { code: normalized } });
        if (conflict) {
          return NextResponse.json({ success: false, message: "Promo code already exists" }, { status: 409 });
        }
      }
      updateData.code = normalized;
    }

    if (type !== undefined) {
      const validTypes = ["percentage", "fixed", "free_delivery"];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ success: false, message: "Invalid type. Use: percentage, fixed, free_delivery" }, { status: 400 });
      }
      updateData.type = type;
    }

    if (value !== undefined) {
      const resolvedType = updateData.type ?? existing.type;
      if (resolvedType === "percentage" && (Number(value) <= 0 || Number(value) > 100)) {
        return NextResponse.json({ success: false, message: "Percentage must be between 1 and 100" }, { status: 400 });
      }
      updateData.value = Number(value);
    }

    if (minOrder !== undefined) updateData.minOrder = minOrder ? Number(minOrder) : 0;
    if (maxUses !== undefined) updateData.maxUses = maxUses ? Number(maxUses) : null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (active !== undefined) updateData.active = Boolean(active);

    const updated = await prisma.promoCode.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/admin/promo-codes/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to update promo code" }, { status: 500 });
  }
}

// ─── DELETE PROMO CODE ────────────────────────────────────────────────────────
export async function DELETE(request, context) {
  if (!verifyAdmin(request)) return unauthorized();

  const ip = getIP(request);
  const rl = rateLimit(`promo-delete:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  const { id: rawId } = await context.params;
  const id = parseInt(rawId);

  try {
    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Promo code not found" }, { status: 404 });
    }

    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Promo code deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/promo-codes/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete promo code" }, { status: 500 });
  }
}
