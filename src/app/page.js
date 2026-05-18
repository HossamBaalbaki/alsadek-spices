"use client";

import { useState, useEffect, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/shop/ProductCard";
import { SkeletonCard } from "@/components/ui/Skeleton";

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────
const CAT_CONFIG = {
  "whole-spices":      { gradient: "from-red-950 to-amber-900",    emoji: "🌶️" },
  "ground-spices":     { gradient: "from-orange-900 to-yellow-800", emoji: "🫙" },
  blends:              { gradient: "from-amber-900 to-stone-800",   emoji: "🫚" },
  herbs:               { gradient: "from-green-950 to-emerald-800", emoji: "🌿" },
  bundles:             { gradient: "from-purple-950 to-amber-900",  emoji: "🎁" },
  "arabic-spices":     { gradient: "from-amber-900 to-orange-950",  emoji: "🌿" },
  "arabic-spices-":    { gradient: "from-amber-900 to-orange-950",  emoji: "🌿" },
  "indian-spices":     { gradient: "from-orange-900 to-red-950",    emoji: "🍛" },
  "iranian-spices":    { gradient: "from-rose-900 to-pink-950",     emoji: "🌺" },
  "salt-pepper":       { gradient: "from-stone-700 to-stone-900",   emoji: "🧂" },
  "nuts-dried-fruits": { gradient: "from-yellow-900 to-amber-950",  emoji: "🌰" },
  "packages-bundles":  { gradient: "from-purple-900 to-violet-950", emoji: "🎁" },
};

function CategoryCard({ cat, isArabic }) {
  const [imgError, setImgError] = useState(false);
  const cfg = CAT_CONFIG[cat.slug] || { gradient: "from-stone-800 to-stone-700", emoji: "🌶️" };
  const hasImage = cat.image && cat.image.trim() && !imgError;
  const displayEmoji = (cat.icon && cat.icon.trim()) ? cat.icon : cfg.emoji;

  return (
    <Link
      href={`/shop?category=${cat.slug}`}
      className={`group relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br ${cfg.gradient} flex flex-col items-center justify-end hover:scale-[1.03] transition-all duration-300 shadow-xl`}
    >
      {/* Background image */}
      {hasImage && (
        <Image
          src={cat.image}
          alt={isArabic ? cat.nameAr : cat.nameEn}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          sizes="(max-width: 768px) 50vw, 20vw"
        />
      )}

      {/* Big emoji (shown when no image) */}
      {!hasImage && (
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] text-[90px] opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all duration-300 select-none">
          {displayEmoji}
        </span>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      {/* Text */}
      <div className="relative z-10 text-center pb-5 px-3">
        <p className="font-black text-white text-base leading-tight">
          {isArabic ? cat.nameAr : cat.nameEn}
        </p>
        <p className="text-white/50 text-xs mt-1">
          {cat.productCount} {isArabic ? "منتج" : "products"}
        </p>
      </div>
    </Link>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t, isArabic } = useLanguage();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState(null);

  const fetchHomeData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [fRes, bRes, cRes, sRes] = await Promise.all([
        fetch("/api/products?featured=true&limit=4"),
        fetch("/api/products?bestSeller=true&limit=4"),
        fetch("/api/categories?active=true"),
        fetch("/api/site-settings", { cache: "no-store" }),
      ]);
      const [fData, bData, cData, sData] = await Promise.all([
        fRes.json(), bRes.json(), cRes.json(), sRes.json(),
      ]);
      if (fData.success) setFeaturedProducts(fData.data);
      if (bData.success) setBestSellers(bData.data);
      if (cData.success) setCategories(cData.data);
      if (sData.success) setSiteSettings(sData.data);
    } catch (e) {
      console.error("Home data error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHomeData(); }, [fetchHomeData]);
  usePolling(() => fetchHomeData(true), 30000);

  const defaultTickerEn = ["🌶️ 100% Natural Spices", "🚚 Same-Day Delivery in Doha", "⭐ Premium Quality Guaranteed", "💰 Best Prices in Qatar", "🎁 Elegant Gift Bundles", "📦 Professional Packaging"];
  const defaultTickerAr = ["🌶️ بهارات طبيعية 100%", "🚚 توصيل في نفس اليوم بالدوحة", "⭐ جودة فاخرة مضمونة", "💰 أفضل الأسعار في قطر", "🎁 باقات هدايا راقية", "📦 تغليف احترافي"];

  const tickerItems = (isArabic
    ? siteSettings?.tickerItemsAr
    : siteSettings?.tickerItemsEn
  ) || (isArabic ? [...defaultTickerAr] : [...defaultTickerEn]);

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

  return (
    <>
      <Navbar />
      <main>

        {/* ═══════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════ */}
        <section className="relative min-h-[92vh] flex items-center bg-stone-950 overflow-hidden">
          {/* Layered glow backgrounds */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,rgba(180,83,9,0.22)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_80%_20%,rgba(251,191,36,0.07)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_65%_85%,rgba(120,53,15,0.18)_0%,transparent_60%)]" />
          </div>

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* Floating decorative spices */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <span className="absolute top-[14%] right-[8%]  text-[80px] opacity-10 animate-float-slow">🌶️</span>
            <span className="absolute top-[55%] right-[18%] text-[60px] opacity-10 animate-float-medium">🫙</span>
            <span className="absolute top-[28%] right-[32%] text-[44px] opacity-[0.06] animate-float-fast">🌿</span>
            <span className="absolute bottom-[18%] right-[6%]  text-[70px] opacity-[0.08] animate-float-medium">🎁</span>
            <span className="absolute bottom-[35%] left-[4%]  text-[50px] opacity-[0.05] animate-float-slow">⭐</span>
          </div>

          <div className="container relative z-10">
            <div className="max-w-3xl py-16 md:py-24">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-amber-400 text-sm font-semibold tracking-wide">
                  {isArabic
                    ? "متجر البهارات الأول في قطر"
                    : "Qatar's Premier Spice Store"}
                </span>
              </div>

              {/* Main headline */}
              <h1
                className={`font-black text-white mb-7 ${
                  isArabic
                    ? "text-[2.8rem] md:text-[5.5rem] leading-[1.5]"
                    : "text-[3.5rem] md:text-[6rem] leading-[1.04]"
                }`}
              >
                {isArabic ? (
                  <>
                    نكهات{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                      أصيلة
                    </span>
                    <br />
                    من قلب{" "}
                    <span className="text-stone-500">الشرق</span>
                  </>
                ) : (
                  <>
                    Authentic
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                      Flavors
                    </span>{" "}
                    from
                    <br />
                    <span className="text-stone-500">the East</span>
                  </>
                )}
              </h1>

              {/* Sub-headline */}
              <p className="text-stone-400 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
                {isArabic
                  ? "اكتشف مجموعتنا الفاخرة من البهارات والتوابل المختارة بعناية من أجود المصادر حول العالم"
                  : "Discover our premium collection of spices and herbs, carefully selected from the world's finest sources"}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 mb-16">
                <Link
                  href="/shop"
                  className="btn btn-primary btn-lg group shadow-lg shadow-amber-900/30"
                >
                  <span>{isArabic ? "تسوق الآن" : "Shop Now"}</span>
                  <span className="group-hover:translate-x-1 transition-transform inline-block">
                    {isArabic ? "←" : "→"}
                  </span>
                </Link>
                <Link
                  href="/shop?category=bundles"
                  className="btn btn-lg border-2 border-white/15 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm"
                >
                  🎁{" "}
                  {isArabic ? "باقات الهدايا" : "Gift Bundles"}
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            MARQUEE TICKER
        ═══════════════════════════════════════════════════ */}
        <div className="bg-amber-700 py-3.5 overflow-hidden border-y border-amber-600">
          <div className="flex animate-ticker whitespace-nowrap">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-white text-sm font-semibold"
              >
                <span className="mx-6">{item}</span>
                <span className="text-amber-300/60">◆</span>
              </span>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            CATEGORIES — dark editorial style
        ═══════════════════════════════════════════════════ */}
        <section className="py-20 bg-stone-950">
          <div className="container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  {isArabic ? "استكشف" : "Explore"}
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  {isArabic ? "تسوق حسب الفئة" : "Shop by Category"}
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                {isArabic ? "← عرض الكل" : "View All →"}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-3xl bg-stone-800 animate-pulse"
                    />
                  ))
                : categories.map((cat) => (
                    <CategoryCard key={cat.id} cat={cat} isArabic={isArabic} />
                  ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FEATURED PRODUCTS
        ═══════════════════════════════════════════════════ */}
        <section className="py-20 bg-stone-50">
          <div className="container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-amber-700 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  {isArabic ? "مختارة بعناية" : "Handpicked for you"}
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-stone-900">
                  {isArabic ? "منتجات مميزة" : "Featured Products"}
                </h2>
              </div>
              <Link href="/shop" className="btn btn-outline btn-sm">
                {isArabic ? "عرض الكل" : "View All"}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {loading
                ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                : featuredProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} priority={i < 4} />
                  ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            PROMO BANNER
        ═══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-amber-700">
          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/10 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-amber-600/40 rounded-full blur-3xl" />
          </div>

          <div className="container relative py-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <p className="text-amber-200 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  {isArabic ? "عرض خاص" : "Special Offer"}
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
                  {isArabic
                    ? siteSettings?.promoTitleAr ||
                      "توصيل مجاني للطلبات فوق 150 ر.ق"
                    : siteSettings?.promoTitleEn ||
                      "Free Delivery on Orders Over 150 QAR"}
                </h2>
                <p className="text-amber-100 text-lg">
                  {isArabic
                    ? siteSettings?.promoSubtitleAr ||
                      "استخدم كود WELCOME10 للحصول على خصم 10%"
                    : siteSettings?.promoSubtitleEn ||
                      "Use code WELCOME10 for 10% off your first order"}
                </p>
              </div>
              <Link
                href="/shop"
                className="btn btn-lg bg-white text-amber-700 hover:bg-stone-50 font-black flex-shrink-0 px-10 shadow-lg"
              >
                {isArabic ? "← تسوق الآن" : "Shop Now →"}
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            BEST SELLERS
        ═══════════════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-amber-700 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                  {isArabic ? "الأكثر طلباً" : "Customer Favorites"}
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-stone-900">
                  {isArabic ? "الأكثر مبيعاً" : "Best Sellers"}
                </h2>
              </div>
              <Link
                href="/shop?sort=best-selling"
                className="btn btn-outline btn-sm"
              >
                {isArabic ? "عرض الكل" : "View All"}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {loading
                ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                : bestSellers.map((p, idx) => (
                    <ProductCard key={p.id} product={p} rank={idx + 1} />
                  ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            WHY CHOOSE US — dark strip
        ═══════════════════════════════════════════════════ */}
        <section className="py-20 bg-stone-950">
          <div className="container">
            <div className="text-center mb-14">
              <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                {isArabic ? "لماذا نحن" : "Why us"}
              </p>
              <h2 className="text-4xl font-black text-white">
                {isArabic ? "لماذا تختار السادق؟" : "Why Choose Al Sadek?"}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                {
                  icon: "🌿",
                  en: { title: "100% Natural", desc: "No additives or preservatives, ever" },
                  ar: { title: "طبيعي 100%", desc: "بدون إضافات أو مواد حافظة أبداً" },
                },
                {
                  icon: "🚚",
                  en: { title: "Same-Day Delivery", desc: "Order by noon, get it today in Doha" },
                  ar: { title: "توصيل في اليوم", desc: "اطلب قبل الظهر وسنوصل لك اليوم" },
                },
                {
                  icon: "⭐",
                  en: { title: "Premium Quality", desc: "Sourced from the world's finest regions" },
                  ar: { title: "جودة فاخرة", desc: "من أفضل المناطق حول العالم" },
                },
                {
                  icon: "💰",
                  en: { title: "Best Prices", desc: "Competitive pricing, no compromises" },
                  ar: { title: "أفضل الأسعار", desc: "أسعار تنافسية بلا تنازلات" },
                },
              ].map((f) => (
                <div
                  key={f.en.title}
                  className="group text-center p-7 rounded-3xl bg-stone-900 border border-stone-800 hover:border-amber-800/50 hover:bg-stone-800 transition-all duration-300"
                >
                  <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="font-black text-white mb-2 text-base">
                    {isArabic ? f.ar.title : f.en.title}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {isArabic ? f.ar.desc : f.en.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            WHATSAPP CTA
        ═══════════════════════════════════════════════════ */}
        <section className="py-20 bg-stone-900 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#25D366]/5 rounded-full blur-3xl" />
          </div>

          <div className="container relative">
            <div className="max-w-2xl mx-auto text-center">
              {/* WhatsApp icon */}
              <div className="w-20 h-20 bg-[#25D366]/15 border border-[#25D366]/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <svg
                  className="w-10 h-10 text-[#25D366]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                {isArabic
                  ? "تحتاج مساعدة؟ تحدث معنا!"
                  : "Need Help? Chat with Us!"}
              </h2>
              <p className="text-stone-400 mb-10 text-lg leading-relaxed">
                {isArabic
                  ? "فريقنا متاح على مدار الساعة للإجابة على استفساراتك وتلقي طلباتك مباشرة"
                  : "Our team is available around the clock to answer your questions and take your orders directly"}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#1DB857] text-white font-black text-base transition-all duration-200 shadow-lg shadow-green-900/30 hover:shadow-xl hover:shadow-green-900/40 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {isArabic ? "تحدث معنا على واتساب" : "Chat on WhatsApp"}
                </a>
                )}
                <Link
                  href="/track"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white font-semibold text-base transition-all duration-200"
                >
                  📦{" "}
                  {isArabic ? "تتبع طلبك" : "Track Your Order"}
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
