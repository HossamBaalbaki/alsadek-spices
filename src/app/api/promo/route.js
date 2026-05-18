import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIP, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request) {
  const ip = getIP(request);
  const rl = rateLimit(`promo:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json({ success: false, message: "Promo code is required", messageAr: "كود الخصم مطلوب" }, { status: 400 });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promo) {
      return NextResponse.json({ success: false, message: "Invalid promo code", messageAr: "كود الخصم غير صحيح" }, { status: 404 });
    }

    if (!promo.active) {
      return NextResponse.json({ success: false, message: "This promo code is no longer active", messageAr: "كود الخصم لم يعد نشطاً" }, { status: 400 });
    }

    if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
      return NextResponse.json({ success: false, message: "This promo code has expired", messageAr: "انتهت صلاحية كود الخصم" }, { status: 400 });
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ success: false, message: "This promo code has reached its maximum uses", messageAr: "وصل كود الخصم إلى الحد الأقصى للاستخدام" }, { status: 400 });
    }

    if (subtotal && Number(promo.minOrder) > 0 && subtotal < Number(promo.minOrder)) {
      return NextResponse.json({ success: false, message: `Minimum order amount is ${promo.minOrder} QAR`, messageAr: `الحد الأدنى للطلب هو ${promo.minOrder} ر.ق` }, { status: 400 });
    }

    let discountAmount = 0;
    let discountLabel = "";

    switch (promo.type) {
      case "percentage":
        discountAmount = ((subtotal || 0) * promo.value) / 100;
        discountLabel = `${promo.value}% off`;
        break;
      case "fixed":
        discountAmount = promo.value;
        discountLabel = `${promo.value} QAR off`;
        break;
      case "free_delivery":
        discountAmount = 0;
        discountLabel = "Free Delivery";
        break;
      default:
        discountAmount = 0;
    }

    return NextResponse.json({
      success: true,
      message: "Promo code applied successfully",
      messageAr: "تم تطبيق كود الخصم بنجاح",
      data: {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        discountAmount: Math.round(discountAmount * 100) / 100,
        discountLabel,
        minOrder: promo.minOrder,
      },
    });
  } catch (error) {
    console.error("POST /api/promo error:", error);
    return NextResponse.json({ success: false, message: "Failed to validate promo code" }, { status: 500 });
  }
}
