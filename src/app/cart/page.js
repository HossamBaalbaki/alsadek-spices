"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/shop/ProductGrid";

export default function CartPage() {
  const { t, isArabic } = useLanguage();
  const {
    cartItems,
    cartCount,
    subtotal,
    deliveryFee,
    discountAmount,
    grandTotal,
    amountToFreeDelivery,
    freeDeliveryProgress,
    FREE_DELIVERY_THRESHOLD,
    updateQuantity,
    removeFromCart,
    promoCode,
    promoError,
    promoSuccess,
    applyPromoCode,
    removePromoCode,
    deliveryZones,
    selectedZone,
    setSelectedZone,
  } = useCart();

  const router = useRouter();
  const [promoInput, setPromoInput] = useState("");
  const [zoneError, setZoneError] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const [crossSell, setCrossSell] = useState([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/products?sort=bestSeller&limit=4")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCrossSell(d.data); })
      .catch(() => {});
  }, []);

  // ─── HANDLE PROMO CODE ───────────────────────────
  const handleApplyPromo = () => {
    if (promoInput.trim()) {
      applyPromoCode(promoInput.trim());
    }
  };

  // ─── NOT YET HYDRATED ───────────────────────────
  if (!mounted) {
    return (
      <>
        <Navbar />
        <main className="page-content">
          <div className="container py-20" />
        </main>
        <Footer />
      </>
    );
  }

  // ─── EMPTY CART ───────────────────────────
  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="page-content">
          <div className="container py-20">
            <div className="empty-state">
              <div className="text-8xl">🛒</div>
              <div>
                <h2 className="text-2xl font-black text-stone-800 mb-2">
                  {isArabic ? "سلة التسوق فارغة" : "Your Cart is Empty"}
                </h2>
                <p className="text-stone-400">
                  {isArabic
                    ? "أضف بعض المنتجات لتبدأ التسوق"
                    : "Add some products to start shopping"}
                </p>
              </div>
              <Link href="/shop" className="btn btn-primary btn-lg">
                {isArabic ? "تسوق الآن" : "Shop Now"}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-content">

        {/* ─── PAGE HEADER ─────────────────────────── */}
        <div className="bg-stone-900 py-8">
          <div className="container">
            <h1 className="text-2xl font-black text-white">
              {isArabic ? "سلة التسوق" : "Shopping Cart"}
              <span className="text-amber-400 ml-2">({cartCount})</span>
            </h1>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ─── LEFT — CART ITEMS ─────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* ─── FREE DELIVERY PROGRESS ─────────────────────────── */}
              {amountToFreeDelivery > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-amber-800">
                      🚚{" "}
                      {isArabic
                        ? `أضف ${amountToFreeDelivery} ر.ق للتوصيل المجاني`
                        : `Add ${amountToFreeDelivery} QAR for free delivery`}
                    </p>
                    <span className="text-xs text-amber-600 font-bold">
                      {Math.round(freeDeliveryProgress)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${freeDeliveryProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <p className="text-sm font-semibold text-green-700">
                    {isArabic
                      ? "مبروك! أنت مؤهل للتوصيل المجاني"
                      : "Congratulations! You qualify for free delivery"}
                  </p>
                </div>
              )}

              {/* ─── CART ITEMS LIST ─────────────────────────── */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {cartItems.map((item, index) => (
                  <div
                    key={item.cartItemId}
                    className={`flex items-center gap-4 p-4 ${
                      index !== cartItems.length - 1
                        ? "border-b border-stone-100"
                        : ""
                    }`}
                  >
                {/* Product Image */}
<div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
  {item.image && !imageErrors[item.cartItemId] ? (
    <Image
      src={item.image}
      alt={isArabic ? item.nameAr : item.nameEn}
      fill
      className="object-cover"
      onError={() =>
        setImageErrors((prev) => ({
          ...prev,
          [item.cartItemId]: true,
        }))
      }
      sizes="80px"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
      <span className="text-2xl">🌶️</span>
    </div>
  )}
</div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-bold text-stone-800 text-sm hover:text-amber-700 transition-colors line-clamp-1"
                      >
                        {isArabic ? item.nameAr : item.nameEn}
                      </Link>

                      {/* Weight */}
                      {item.weight && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          {item.weight}
                        </p>
                      )}

                      {/* Type Badge */}
                      {item.type === "bundle" && (
                        <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold mt-1">
                          📦 {isArabic ? "باقة" : "Bundle"}
                        </span>
                      )}

                      {/* Mobile Price */}
                      <p className="text-sm font-black text-stone-800 mt-1 sm:hidden">
                        {(item.price * item.quantity).toFixed(2)}{" "}
                        {t.general.qar}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className="quantity-selector">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            className={`quantity-btn ${item.quantity >= (item.maxQty ?? 9999) ? "opacity-40 cursor-not-allowed" : ""}`}
                            onClick={() => {
                              if (item.quantity < (item.maxQty ?? 9999)) {
                                updateQuantity(item.cartItemId, item.quantity + 1);
                              }
                            }}
                            disabled={item.quantity >= (item.maxQty ?? 9999)}
                          >
                            +
                          </button>
                        </div>
                        {item.maxQty != null && item.maxQty < 9999 && item.quantity >= item.maxQty && (
                          <span className="text-[10px] text-red-500 font-semibold whitespace-nowrap">
                            {isArabic ? "الحد الأقصى" : "Max stock"}
                          </span>
                        )}
                      </div>

                      {/* Price — Desktop */}
                      <div className="hidden sm:block text-right min-w-[80px]">
                        <p className="font-black text-stone-800 text-sm">
                          {(item.price * item.quantity).toFixed(2)}{" "}
                          {t.general.qar}
                        </p>
                        <p className="text-xs text-stone-400">
                          {item.price} {t.general.qar}{" "}
                          {isArabic ? "للوحدة" : "each"}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        aria-label="Remove item"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── DELIVERY ZONE SELECTOR ─────────────────────────── */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <span>🚚</span>
                  {isArabic ? "اختر منطقة التوصيل" : "Select Delivery Zone"}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {deliveryZones
                    .filter((z) => z.active)
                    .map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => setSelectedZone(zone)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedZone?.id === zone.id
                            ? "border-amber-700 bg-amber-50"
                            : "border-stone-200 hover:border-amber-300"
                        }`}
                      >
                        <p className="font-bold text-stone-800 text-sm">
                          {isArabic ? zone.nameAr : zone.nameEn}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {isArabic
                            ? zone.estimatedTimeAr
                            : zone.estimatedTime}
                        </p>
                        <p className="text-sm font-black text-amber-700 mt-1">
                          {subtotal >= FREE_DELIVERY_THRESHOLD
                            ? isArabic
                              ? "مجاني 🎉"
                              : "Free 🎉"
                            : `${zone.price} ${t.general.qar}`}
                        </p>
                      </button>
                    ))}
                </div>
              </div>

              {/* ─── CONTINUE SHOPPING ─────────────────────────── */}
              <Link
                href="/shop"
                className="flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors w-fit"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {isArabic ? "متابعة التسوق" : "Continue Shopping"}
              </Link>
            </div>

            {/* ─── RIGHT — ORDER SUMMARY ─────────────────────────── */}
            <div className="sticky-summary">
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="font-bold text-stone-800 text-lg mb-5">
                  {isArabic ? "ملخص الطلب" : "Order Summary"}
                </h3>

                {/* Promo Code */}
                <div className="mb-5">
                  <p className="text-sm font-semibold text-stone-700 mb-2">
                    {isArabic ? "كود الخصم" : "Promo Code"}
                  </p>

                  {promoCode ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-bold text-green-700">
                          {promoCode.code}
                        </p>
                        <p className="text-xs text-green-600">
                          {promoCode.type === "percentage"
                            ? `${promoCode.value}% off`
                            : promoCode.type === "free_delivery"
                            ? isArabic
                              ? "توصيل مجاني"
                              : "Free Delivery"
                            : `${promoCode.value} QAR off`}
                        </p>
                      </div>
                      <button
                        onClick={removePromoCode}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) =>
                          setPromoInput(e.target.value.toUpperCase())
                        }
                        placeholder={
                          isArabic ? "أدخل الكود" : "Enter code"
                        }
                        className="input flex-1 text-sm"
                       
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleApplyPromo();
                        }}
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="btn btn-primary btn-sm px-4"
                      >
                        {isArabic ? "تطبيق" : "Apply"}
                      </button>
                    </div>
                  )}

                  {/* Promo Error */}
                  {promoError && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      ❌ {promoError}
                    </p>
                  )}

                  {/* Promo Success */}
                  {promoSuccess && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✅ {promoSuccess}
                    </p>
                  )}
                </div>

                {/* Free Delivery Progress */}
                {amountToFreeDelivery > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex justify-between text-xs font-semibold text-amber-800 mb-2">
                      <span>{isArabic ? "التوصيل المجاني" : "Free Delivery"}</span>
                      <span>
                        {isArabic
                          ? `${amountToFreeDelivery.toFixed(2)} ر.ق متبقي`
                          : `${amountToFreeDelivery.toFixed(2)} QAR away`}
                      </span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(freeDeliveryProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="divider" />

                {/* Price Breakdown */}
                <div className="flex flex-col gap-3 mb-4">

                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">
                      {isArabic ? "المجموع الفرعي" : "Subtotal"}
                    </span>
                    <span className="font-semibold text-stone-800">
                      {subtotal.toFixed(2)} {t.general.qar}
                    </span>
                  </div>

                  {/* Delivery Fee */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">
                      {isArabic ? "رسوم التوصيل" : "Delivery Fee"}
                      {selectedZone && (
                        <span className="text-xs text-stone-400 ml-1">
                          ({isArabic ? selectedZone.nameAr : selectedZone.nameEn})
                        </span>
                      )}
                    </span>
                    <span
                      className={`font-semibold ${
                        deliveryFee === 0
                          ? "text-green-600"
                          : "text-stone-800"
                      }`}
                    >
                      {deliveryFee === 0
                        ? isArabic
                          ? "مجاني 🎉"
                          : "Free 🎉"
                        : `${deliveryFee} ${t.general.qar}`}
                    </span>
                  </div>

                  {/* Discount */}
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600">
                        {isArabic ? "الخصم" : "Discount"}
                      </span>
                      <span className="font-semibold text-green-600">
                        -{discountAmount.toFixed(2)} {t.general.qar}
                      </span>
                    </div>
                  )}
                </div>

                <div className="divider" />

                {/* Grand Total */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-black text-stone-900 text-lg">
                    {isArabic ? "الإجمالي" : "Total"}
                  </span>
                  <span className="font-black text-stone-900 text-2xl">
                    {grandTotal.toFixed(2)}{" "}
                    <span className="text-sm font-semibold text-stone-500">
                      {t.general.qar}
                    </span>
                  </span>
                </div>

                {/* Checkout Button */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedZone) {
                    setZoneError(isArabic ? "يجب اختيار منطقة التوصيل قبل المتابعة" : "Please select a delivery zone before checkout");
                    return;
                  }
                  setZoneError("");
                  router.push("/checkout");
                }}
                className={`btn btn-lg btn-full justify-center ${
                  selectedZone ? "btn-primary" : "btn-outline border-red-300 text-red-600"
                }`}
              >
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {isArabic ? "إتمام الطلب" : "Proceed to Checkout"}
                </button>
                {zoneError && (
                  <p className="text-xs text-red-500 mt-2 text-center font-medium">{zoneError}</p>
                )}

                {/* Security Note */}
                <p className="text-xs text-stone-400 text-center mt-4 flex items-center justify-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  {isArabic
                    ? "دفع آمن ومشفر 100%"
                    : "100% Secure & Encrypted Payment"}
                </p>
              </div>

              {/* ─── ACCEPTED PAYMENTS ─────────────────────────── */}
              <div className="bg-white rounded-2xl border border-stone-200 p-4 mt-4">
                <p className="text-xs text-stone-500 font-semibold mb-3 text-center">
                  {isArabic ? "طرق الدفع المقبولة" : "Accepted Payments"}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    <span className="text-amber-700 font-bold text-xs">
                      💵 {isArabic ? "كاش عند الاستلام" : "Cash on Delivery"}
                    </span>
                  </div>
                  <div className="bg-stone-100 rounded-lg px-3 py-1.5 opacity-40 flex items-center gap-1.5" title="Coming soon">
                    <span className="text-blue-800 font-black text-xs">VISA</span>
                    <span className="text-stone-400 text-[9px] font-semibold">{isArabic ? "قريباً" : "Soon"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ─── CROSS-SELL ─────────────────────────── */}
        {crossSell.length > 0 && (
          <div className="container pb-8">
            <div className="section-header mb-4">
              <h2 className="text-xl font-black text-stone-900">
                {isArabic ? "قد يعجبك أيضاً" : "You Might Also Like"}
              </h2>
              <Link href="/shop" className="text-sm font-semibold text-amber-700 hover:text-amber-900">
                {isArabic ? "عرض الكل" : "View all"}
              </Link>
            </div>
            <ProductGrid products={crossSell} loading={false} columns="default" />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}