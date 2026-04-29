import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";
import { rateLimit, getIP, tooManyRequests } from "@/lib/rateLimit";

// ─── LIST ALL PROMO CODES ─────────────────────────────────────────────────────
export async function GET(request) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: codes });
  } catch (error) {
    console.error("GET /api/admin/promo-codes error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch promo codes" }, { status: 500 });
  }
}

// ─── CREATE PROMO CODE ────────────────────────────────────────────────────────
export async function POST(request) {
  if (!verifyAdmin(request)) return unauthorized();

  const ip = getIP(request);
  const rl = rateLimit(`promo-create:${ip}`, { windowMs: 60_000, max: 30 });
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  try {
    const body = await request.json();
    const { code, type, value, minOrder, maxUses, expiresAt, active } = body;

    if (!code || !type) {
      return NextResponse.json({ success: false, message: "code and type are required" }, { status: 400 });
    }

    const validTypes = ["percentage", "fixed", "free_delivery"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: "Invalid type. Use: percentage, fixed, free_delivery" }, { status: 400 });
    }

    const numValue = type === "free_delivery" ? 0 : Number(value);

    if (type !== "free_delivery" && (value == null || value === "" || isNaN(numValue))) {
      return NextResponse.json({ success: false, message: "value is required for this type" }, { status: 400 });
    }

    if (type === "percentage" && (numValue <= 0 || numValue > 100)) {
      return NextResponse.json({ success: false, message: "Percentage must be between 1 and 100" }, { status: 400 });
    }

    const existing = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return NextResponse.json({ success: false, message: "Promo code already exists" }, { status: 409 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        type,
        value: numValue,
        minOrder: minOrder ? Number(minOrder) : 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false,
      },
    });

    return NextResponse.json({ success: true, data: promo }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/promo-codes error:", error);
    return NextResponse.json({ success: false, message: "Failed to create promo code" }, { status: 500 });
  }
}
