"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { getBestSellers, isSoldOut, getDiscountedPrice } from "@/data/products";
import { ProductBadges } from "@/components/ui/Badge";
import Image from "next/image";

// ─── BEST SELLER CARD ───────────────────────────
function BestSellerCard({ product, rank }) {
  const { t, getName, isArabic } = useLanguage();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const soldOut = isSoldOut(product);
  const productName = getName(product);

  // ─── GET PRICE ───────────────────────────
  const getPrice = () => {
    if (product.type === "bundle") return product.price;
    return product.variants[0]?.price || 0;
  };

  const price = getPrice();
  const finalPrice = product.labels.isSale
    ? getDiscountedPrice(price, product.labels.salePercent)
    : price;

  // ─── HANDLE ADD TO CART ───────────────────────────
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    setLoading(true);
    setTimeout(() => {
      addToCart(
        product,
        product.type === "single" ? product.variants[0] : null,
        1
      );
      setLoading(false);
    }, 500);
  };

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        className={`group flex items-center gap-4 p-4 bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg hover:border-amber-200 ${
          soldOut ? "opacity-75" : ""
        } ${rank === 1 ? "border-amber-300 bg-amber-50/50" : "border-stone-200"}`}
      >
        {/* ─── RANK NUMBER ─────────────────────────── */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
            rank === 1
              ? "bg-amber-500 text-white"
              : rank === 2
              ? "bg-stone-400 text-white"
              : rank === 3
              ? "bg-amber-700 text-white"
              : "bg-stone-100 text-stone-500"
          }`}
        >
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
        </div>

        {/* ─── PRODUCT IMAGE ─────────────────────────── */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
          {/* Badges */}
          <div className="absolute top-0 left-0 z-10 scale-75 origin-top-left">
            <ProductBadges
              labels={product.labels}
              isSoldOut={soldOut}
              position="card"
            />
          </div>

          {/* Image */}
          {!imageError ? (
            <Image
              src={product.images[0]}
              alt={productName}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => setImageError(true)}
              sizes="64px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
              <span className="text-2xl">🌶️</span>
            </div>
          )}
        </div>

        {/* ─── PRODUCT INFO ─────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="font-bold text-stone-800 text-sm truncate group-hover:text-amber-700 transition-colors">
            {productName}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-xs font-semibold text-stone-600">
              {product.rating}
            </span>
            <span className="text-xs text-stone-400">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-black text-stone-800 text-sm">
              {finalPrice}{" "}
              <span className="text-xs font-semibold text-stone-500">
                {t.general.qar}
              </span>
            </span>
            {product.labels.isSale && (
              <span className="text-xs text-stone-400 line-through">
                {price} {t.general.qar}
              </span>
            )}
          </div>
        </div>

        {/* ─── ADD TO CART BUTTON ─────────────────────────── */}
        <div onClick={(e) => e.preventDefault()}>
          {soldOut ? (
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-amber-700 hover:bg-amber-800 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110 shadow-md"
            >
              {loading ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
              ) : (
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── MAIN BEST SELLERS COMPONENT ───────────────────────────
export default function BestSellers() {
  const { t, isArabic } = useLanguage();
  const bestSellers = getBestSellers();

  return (
    <section className="section-padding bg-stone-50">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* ─── LEFT SIDE — TEXT + LIST ─────────────────────────── */}
          <div>
            {/* Section Header */}
            <div className="mb-8">
              {/* Label */}
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                <span>🔥</span>
                <span>{isArabic ? "الأكثر مبيعاً" : "Best Sellers"}</span>
              </div>

              {/* Title */}
              <h2 className="section-title">
                {t.bestSellers.title}
              </h2>

              {/* Subtitle */}
              <p className="section-subtitle">
                {t.bestSellers.subtitle}
              </p>
            </div>

            {/* ─── BEST SELLER LIST ─────────────────────────── */}
            <div className="flex flex-col gap-3">
              {bestSellers.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <BestSellerCard
                    product={product}
                    rank={index + 1}
                  />
                </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="mt-6">
              <Link
                href="/shop?filter=best-selling"
                className="btn btn-outline btn-lg w-full sm:w-auto"
              >
                {t.bestSellers.viewAll}
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
          </div>

          {/* ─── RIGHT SIDE — PROMO CARD ─────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* ─── SPECIAL OFFER CARD ─────────────────────────── */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Content */}
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                  <span>🎉</span>
                  <span>
                    {isArabic ? "عرض خاص" : "Special Offer"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-black mb-2">
                  {isArabic
                    ? "وفر حتى 20% على الباقات"
                    : "Save up to 20% on Bundles"}
                </h3>

                {/* Description */}
                <p className="text-stone-400 text-sm mb-6 leading-relaxed">
                  {isArabic
                    ? "اشترِ باقاتنا المميزة ووفر أكثر مقارنة بشراء المنتجات بشكل منفرد"
                    : "Buy our special bundles and save more compared to buying products individually"}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      value: "6+",
                      labelEn: "Bundle Options",
                      labelAr: "خيارات الباقات",
                    },
                    {
                      value: "20%",
                      labelEn: "Max Savings",
                      labelAr: "أقصى توفير",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white/10 rounded-xl p-3 text-center"
                    >
                      <p className="text-2xl font-black text-amber-400">
                        {stat.value}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        {isArabic ? stat.labelAr : stat.labelEn}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href="/shop?category=packages-bundles"
                  className="btn bg-amber-600 hover:bg-amber-500 text-white border-amber-600 hover:border-amber-500 btn-lg w-full justify-center"
                >
                  {isArabic ? "تسوق الباقات الآن" : "Shop Bundles Now"}
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
            </div>

            {/* ─── DELIVERY INFO CARD ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h4 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span>🚚</span>
                {isArabic ? "معلومات التوصيل" : "Delivery Info"}
              </h4>

              <div className="flex flex-col gap-3">
                {[
                  {
                    zone: isArabic ? "وسط الدوحة" : "Doha Center",
                    price: "10",
                                        time: isArabic ? "1-2 ساعة" : "1-2 Hours",
                    color: "bg-green-100 text-green-700",
                  },
                  {
                    zone: isArabic ? "الريان / لوسيل" : "Al Rayyan / Lusail",
                    price: "15",
                    time: isArabic ? "2-3 ساعات" : "2-3 Hours",
                    color: "bg-blue-100 text-blue-700",
                  },
                  {
                    zone: isArabic ? "الوكرة" : "Al Wakra",
                    price: "20",
                    time: isArabic ? "3-4 ساعات" : "3-4 Hours",
                    color: "bg-amber-100 text-amber-700",
                  },
                  {
                    zone: isArabic ? "الخور وما بعدها" : "Al Khor & Beyond",
                    price: "25+",
                    time: isArabic ? "اليوم التالي" : "Next Day",
                    color: "bg-stone-100 text-stone-700",
                  },
                ].map((zone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                  >
                    {/* Zone Name */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-stone-700 font-medium">
                        {zone.zone}
                      </span>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                      {/* Time */}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${zone.color}`}
                      >
                        {zone.time}
                      </span>

                      {/* Price */}
                      <span className="text-sm font-black text-stone-800">
                        {zone.price} {t.general.qar}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Free Delivery Note */}
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-green-600 text-lg">🎉</span>
                <p className="text-green-700 text-xs font-semibold">
                  {isArabic
                    ? "توصيل مجاني للطلبات فوق 200 ر.ق"
                    : "Free delivery on orders above 200 QAR"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}