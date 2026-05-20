"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function HeroBanner() {
  const { t, isArabic } = useLanguage();

  // ─── STATS ───────────────────────────
  const stats = [
    {
      value: t.hero.stat1Value,
      label: t.hero.stat1Label,
      icon: "🌶️",
    },
    {
      value: t.hero.stat2Value,
      label: t.hero.stat2Label,
      icon: "😊",
    },
    {
      value: t.hero.stat3Value,
      label: t.hero.stat3Label,
      icon: "🚚",
    },
  ];

  return (
    <section className="hero-section">
      {/* ─── BACKGROUND PATTERN ─────────────────────────── */}
      <div className="hero-pattern" />

      {/* ─── DECORATIVE CIRCLES ─────────────────────────── */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-green-500/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-700/5 blur-3xl" />

      {/* ─── MAIN CONTENT ─────────────────────────── */}
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16">

          {/* ─── LEFT SIDE — TEXT ─────────────────────────── */}
          <div className={`flex flex-col gap-6 ${isArabic ? "lg:order-2" : "lg:order-1"}`}>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-700/20 border border-amber-700/30 text-amber-400 px-4 py-2 rounded-full text-sm font-semibold w-fit">
              <span>✨</span>
              <span>{t.hero.badge}</span>
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                {t.hero.title}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  {t.hero.titleHighlight}
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-stone-400 text-lg leading-relaxed max-w-lg">
              {t.hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {/* Shop Now */}
              <Link
                href="/shop"
                className="btn btn-primary btn-lg group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {t.hero.shopNow}
              </Link>

              {/* Explore Categories */}
              <Link
                href="/shop"
                className="btn btn-lg border-2 border-stone-600 text-stone-300 hover:border-amber-500 hover:text-amber-400 transition-all"
              >
                {t.hero.exploreCategories}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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

            {/* ─── STATS ─────────────────────────── */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-stone-700/50">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-xl">
                    {stat.icon}
                  </div>
                  {/* Text */}
                  <div>
                    <p className="text-xl font-black text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-stone-400 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT SIDE — VISUAL ─────────────────────────── */}
          <div
            className={`flex items-center justify-center ${
              isArabic ? "lg:order-1" : "lg:order-2"
            }`}
          >
            {/* Main Visual Card */}
            <div className="relative w-full max-w-md">

              {/* Main Card */}
              <div className="bg-stone-800/80 backdrop-blur-sm border border-stone-700 rounded-3xl p-8 text-center shadow-2xl">

                {/* Logo */}
                <div className="flex justify-center mb-4 animate-bounce">
                  <div className="bg-white/90 rounded-3xl p-3 shadow-2xl shadow-black/30">
                    <Image
                      src="https://res.cloudinary.com/dltz3gpiy/image/upload/q_auto,f_auto,w_400/branding/alsadeq-logo-nobg"
                      alt="Al Sadeq Spices"
                      width={160}
                      height={160}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white mb-2">
                  {isArabic ? "الصادق للبهارات" : "Al Sadeq Spices"}
                </h2>

                <p className="text-stone-400 text-sm mb-6">
                  {isArabic
                    ? "الدوحة، قطر 🇶🇦"
                    : "Doha, Qatar 🇶🇦"}
                </p>

                {/* Spice Icons Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { emoji: "🫚", name: isArabic ? "زيت" : "Oil" },
                    { emoji: "🧄", name: isArabic ? "ثوم" : "Garlic" },
                    { emoji: "🫛", name: isArabic ? "هيل" : "Cardamom" },
                    { emoji: "🌿", name: isArabic ? "أعشاب" : "Herbs" },
                    { emoji: "🟡", name: isArabic ? "كركم" : "Turmeric" },
                    { emoji: "🤎", name: isArabic ? "قرفة" : "Cinnamon" },
                    { emoji: "⭐", name: isArabic ? "زعفران" : "Saffron" },
                    { emoji: "🌱", name: isArabic ? "كمون" : "Cumin" },
                  ].map((spice, index) => (
                    <div
                      key={index}
                      className="bg-stone-700/50 rounded-xl p-2 flex flex-col items-center gap-1 hover:bg-amber-700/30 transition-colors cursor-default"
                    >
                      <span className="text-xl">{spice.emoji}</span>
                      <span className="text-xs text-stone-400 font-medium">
                        {spice.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery Badge */}
                <div className="bg-green-900/40 border border-green-700/40 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
                  <span className="text-green-400 text-lg">🚚</span>
                  <span className="text-green-400 text-sm font-semibold">
                    {isArabic
                      ? "توصيل سريع في الدوحة"
                      : "Fast Delivery in Doha"}
                  </span>
                </div>
              </div>

              {/* ─── FLOATING CARDS ─────────────────────────── */}

              {/* Top Left Float */}
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 animate-fadeIn">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-xs font-black text-stone-800">4.9/5</p>
                  <p className="text-xs text-stone-400">
                    {isArabic ? "تقييم" : "Rating"}
                  </p>
                </div>
              </div>

              {/* Bottom Right Float */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 animate-fadeIn">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <p className="text-xs font-black text-stone-800">
                    {isArabic ? "طازج دائماً" : "Always Fresh"}
                  </p>
                  <p className="text-xs text-stone-400">
                    {isArabic ? "مضمون" : "Guaranteed"}
                  </p>
                </div>
              </div>

              {/* Top Right Float */}
              <div className="absolute -top-4 -right-4 bg-amber-700 rounded-2xl shadow-xl p-3 animate-fadeIn">
                <p className="text-xs font-black text-white">
                  {isArabic ? "توصيل مجاني" : "Free Delivery"}
                </p>
                <p className="text-xs text-amber-200">
                  {isArabic ? "فوق 200 ر.ق" : "Above 200 QAR"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM WAVE ─────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60L48 50C96 40 192 20 288 15C384 10 480 20 576 25C672 30 768 30 864 25C960 20 1056 10 1152 10C1248 10 1344 20 1392 25L1440 30V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z"
            fill="#fffbf5"
          />
        </svg>
      </div>
    </section>
  );
}