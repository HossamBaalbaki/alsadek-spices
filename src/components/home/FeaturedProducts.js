"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { getFeaturedProducts } from "@/data/products";
import ProductGrid from "@/components/shop/ProductGrid";

export default function FeaturedProducts() {
  const { t, isArabic } = useLanguage();
  const featuredProducts = getFeaturedProducts();

  return (
    <section className="section-padding bg-white">
      <div className="container">

        {/* ─── SECTION HEADER ─────────────────────────── */}
        <div className="section-header">
          <div className="section-header-left">

            {/* Label */}
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <span>⭐</span>
              <span>{isArabic ? "مميز" : "Featured"}</span>
            </div>

            {/* Title */}
            <h2 className="section-title">
              {t.featured.title}
            </h2>

            {/* Subtitle */}
            <p className="section-subtitle">
              {t.featured.subtitle}
            </p>
          </div>

          {/* View All Link — Desktop */}
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors whitespace-nowrap"
          >
            {t.featured.viewAll}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isArabic ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </Link>
        </div>

        {/* ─── PRODUCTS GRID ─────────────────────────── */}
        <ProductGrid
          products={featuredProducts}
          loading={false}
          columns="default"
        />

        {/* ─── VIEW ALL BUTTON — Mobile ─────────────────────────── */}
        <div className="sm:hidden mt-8 text-center">
          <Link href="/shop" className="btn btn-outline btn-lg">
            {t.featured.viewAll}
          </Link>
        </div>

        {/* ─── VIEW ALL BUTTON — Desktop ─────────────────────────── */}
        <div className="hidden sm:flex justify-center mt-10">
          <Link
            href="/shop"
            className="btn btn-primary btn-lg group"
          >
            {t.featured.viewAll}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isArabic ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </Link>
        </div>

        {/* ─── TRUST BADGES ─────────────────────────── */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: "🌿",
              titleEn: "100% Natural",
              titleAr: "طبيعي 100%",
              descEn: "No artificial additives",
              descAr: "بدون إضافات صناعية",
            },
            {
              icon: "🚚",
              titleEn: "Fast Delivery",
              titleAr: "توصيل سريع",
              descEn: "Same day in Doha",
              descAr: "نفس اليوم في الدوحة",
            },
            {
              icon: "💯",
              titleEn: "Quality Guaranteed",
              titleAr: "جودة مضمونة",
              descEn: "Or your money back",
              descAr: "أو استرداد أموالك",
            },
            {
              icon: "🔒",
              titleEn: "Secure Payment",
              titleAr: "دفع آمن",
              descEn: "100% secure checkout",
              descAr: "دفع آمن 100%",
            },
          ].map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl mb-3">
                {badge.icon}
              </div>

              {/* Title */}
              <h4 className="font-bold text-stone-800 text-sm mb-1">
                {isArabic ? badge.titleAr : badge.titleEn}
              </h4>

              {/* Description */}
              <p className="text-xs text-stone-400">
                {isArabic ? badge.descAr : badge.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}