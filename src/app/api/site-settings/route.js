import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  topBannerEn: "🌶️ Free delivery on orders above 200 QAR in Doha 🌶️",
  topBannerAr: "🌶️ توصيل مجاني للطلبات فوق 200 ر.ق في الدوحة 🌶️",
  promoTitleEn: "Free Delivery on Orders Over 150 QAR",
  promoTitleAr: "توصيل مجاني للطلبات فوق 150 ر.ق",
  promoSubtitleEn: "Use code WELCOME10 for 10% off your first order",
  promoSubtitleAr: "استخدم كود WELCOME10 للحصول على خصم 10%",
  promoCode: "WELCOME10",
  promoPercent: 10,
  promoActive: true,
  freeDeliveryThreshold: 200,
  tickerItemsEn: ["🌶️ 100% Natural Spices", "🚚 Same-Day Delivery in Doha", "⭐ Premium Quality Guaranteed", "💰 Best Prices in Qatar", "🎁 Elegant Gift Bundles", "📦 Professional Packaging"],
  tickerItemsAr: ["🌶️ بهارات طبيعية 100%", "🚚 توصيل في نفس اليوم بالدوحة", "⭐ جودة فاخرة مضمونة", "💰 أفضل الأسعار في قطر", "🎁 باقات هدايا راقية", "📦 تغليف احترافي"],
};

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: 1 },
    });

    return NextResponse.json(
      { success: true, data: settings || DEFAULT_SETTINGS },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/site-settings error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_SETTINGS });
  }
}
