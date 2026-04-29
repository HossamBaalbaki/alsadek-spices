import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const zoneCount = await prisma.deliveryZone.count();

  if (zoneCount === 0) {
    console.log("Seeding default delivery zones...");

    await prisma.deliveryZone.createMany({
      data: [
        {
          sortOrder: 1,
          nameEn: "Doha",
          nameAr: "الدوحة",
          estimatedTime: "45-60 min",
          estimatedTimeAr: "45-60 دقيقة",
          price: 10,
          active: true,
        },
        {
          sortOrder: 2,
          nameEn: "Al Wakrah",
          nameAr: "الوكرة",
          estimatedTime: "60-90 min",
          estimatedTimeAr: "60-90 دقيقة",
          price: 15,
          active: true,
        },
        {
          sortOrder: 3,
          nameEn: "Al Khor",
          nameAr: "الخور",
          estimatedTime: "90-120 min",
          estimatedTimeAr: "90-120 دقيقة",
          price: 20,
          active: true,
        },
      ],
    });
  }

  const setting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!setting) {
    await prisma.siteSetting.create({
      data: {
        id: 1,
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
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
