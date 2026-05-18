import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

const DEFAULT_SETTINGS = {
  topBannerEn: "🌶️ Free delivery on orders above 200 QAR in Doha 🌶️",
  topBannerAr: "🌶️ توصيل مجاني للطلبات فوق 200 ر.ق في الدوحة 🌶️",
  promoTitleEn: "Free Delivery on Orders Over 150 QAR",
  promoTitleAr: "توصيل مجاني للطلبات فوق 150 ر.ق",
  promoSubtitleEn: "Shop our premium spices collection",
  promoSubtitleAr: "تسوق مجموعتنا من البهارات الفاخرة",
  freeDeliveryThreshold: 200,
};

export async function GET(request) {
  try {
    const auth = verifyAdmin(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
    return NextResponse.json({ success: true, data: settings || DEFAULT_SETTINGS });
  } catch (error) {
    console.error("GET /api/admin/site-settings error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = verifyAdmin(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const parseTickerItems = (value) => {
      if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
      if (typeof value === "string") return value.split("\n").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const data = {
      topBannerEn: (body.topBannerEn || "").trim(),
      topBannerAr: (body.topBannerAr || "").trim(),
      promoTitleEn: (body.promoTitleEn || "").trim(),
      promoTitleAr: (body.promoTitleAr || "").trim(),
      promoSubtitleEn: (body.promoSubtitleEn || "").trim(),
      promoSubtitleAr: (body.promoSubtitleAr || "").trim(),
      freeDeliveryThreshold: Number(body.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold),
      tickerItemsEn: parseTickerItems(body.tickerItemsEn),
      tickerItemsAr: parseTickerItems(body.tickerItemsAr),
    };

    if (!data.topBannerEn || !data.topBannerAr || !data.promoTitleEn || !data.promoTitleAr || !data.promoSubtitleEn || !data.promoSubtitleAr) {
      return NextResponse.json({ success: false, message: "All text fields are required" }, { status: 400 });
    }

    if (!Number.isFinite(data.freeDeliveryThreshold) || data.freeDeliveryThreshold < 0) {
      return NextResponse.json({ success: false, message: "Free delivery threshold must be 0 or more" }, { status: 400 });
    }

    const settings = await prisma.siteSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json({ success: true, message: "Settings updated successfully", data: settings });
  } catch (error) {
    console.error("PUT /api/admin/site-settings error:", error);
    return NextResponse.json({ success: false, message: "Failed to update settings" }, { status: 500 });
  }
}
