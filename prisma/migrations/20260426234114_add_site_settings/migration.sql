-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "topBannerEn" TEXT NOT NULL,
    "topBannerAr" TEXT NOT NULL,
    "promoTitleEn" TEXT NOT NULL,
    "promoTitleAr" TEXT NOT NULL,
    "promoSubtitleEn" TEXT NOT NULL,
    "promoSubtitleAr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
