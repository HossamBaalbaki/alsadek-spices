"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

const SLUG_COLORS = {
  "arabic-spices":     "from-amber-500 to-orange-600",
  "indian-spices":     "from-orange-500 to-red-600",
  "iranian-spices":    "from-rose-500 to-pink-600",
  "salt-pepper":       "from-stone-500 to-stone-700",
  "nuts-dried-fruits": "from-yellow-500 to-amber-600",
  "packages-bundles":  "from-purple-500 to-violet-600",
};

function CategoryImage({ category, name, gradient }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = category.image && category.image.trim() && !imgError;
  const icon = category.icon && category.icon.trim() ? category.icon : "🌶️";

  return (
    <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ${!hasImage ? `bg-gradient-to-br ${gradient}` : ""}`}>
      {hasImage ? (
        <Image
          src={category.image}
          alt={name}
          width={64}
          height={64}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-3xl">{icon}</span>
      )}
    </div>
  );
}

export default function FeaturedCategories() {
  const { t, getCategoryName, isArabic } = useLanguage();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/categories?active=true")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  return (
    <section className="section-padding bg-stone-50">
      <div className="container">

        {/* ─── SECTION HEADER ─────────────────────────── */}
        <div className="section-header">
          <div className="section-header-left">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <span>🗂️</span>
              <span>{isArabic ? "الفئات" : "Categories"}</span>
            </div>
            <h2 className="section-title">{t.categories.title}</h2>
            <p className="section-subtitle">{t.categories.subtitle}</p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors whitespace-nowrap"
          >
            {t.categories.viewAll}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isArabic ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </Link>
        </div>

        {/* ─── CATEGORIES GRID ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => {
            const gradient = SLUG_COLORS[category.slug] || "from-amber-500 to-orange-600";
            const name = getCategoryName(category);

            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="group flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 cursor-pointer">

                  <CategoryImage category={category} name={name} gradient={gradient} />

                  <div className="text-center">
                    <h3 className="font-bold text-stone-800 text-sm leading-tight group-hover:text-amber-700 transition-colors">
                      {name}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      {category.productCount} {t.categories.products}
                    </p>
                  </div>

                  <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={isArabic ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ─── VIEW ALL (Mobile) ─────────────────────────── */}
        <div className="sm:hidden mt-6 text-center">
          <Link href="/shop" className="btn btn-outline">
            {t.categories.viewAll}
          </Link>
        </div>

        {/* ─── BOTTOM BANNER ─────────────────────────── */}
        <div className="mt-10 bg-gradient-to-r from-amber-700 to-orange-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-white font-black text-lg">
              {isArabic ? "🎁 باقات خاصة بأسعار مميزة!" : "🎁 Special Bundles at Amazing Prices!"}
            </h3>
            <p className="text-amber-200 text-sm mt-1">
              {isArabic ? "وفر أكثر عند شراء الباقات المجمعة" : "Save more when you buy bundle packages"}
            </p>
          </div>
          <Link
            href="/shop?category=packages-bundles"
            className="btn bg-white text-amber-700 hover:bg-amber-50 border-white hover:border-amber-50 whitespace-nowrap flex-shrink-0"
          >
            {isArabic ? "تسوق الباقات" : "Shop Bundles"}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isArabic ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
