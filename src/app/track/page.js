"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const STATUS_FLOW = [
  { key: "pending", labelEn: "Pending", labelAr: "قيد الانتظار", icon: "⏳" },
  { key: "confirmed", labelEn: "Confirmed", labelAr: "مؤكد", icon: "✅" },
  { key: "preparing", labelEn: "Preparing", labelAr: "قيد التحضير", icon: "👨‍🍳" },
  {
    key: "out_for_delivery",
    labelEn: "Out for Delivery",
    labelAr: "في الطريق",
    icon: "🚚",
  },
  { key: "delivered", labelEn: "Delivered", labelAr: "تم التوصيل", icon: "🎉" },
];

const STATUS_BADGE = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  preparing: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  out_for_delivery: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  delivered: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
};

export default function TrackOrderPage() {
  const { isArabic } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);

  const t = (en, ar) => (isArabic ? ar : en);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrders([]);
    setSearched(true);
    try {
      const res = await fetch(`/api/track?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.message || t("Order not found", "لم يتم العثور على الطلب"));
      }
    } catch (err) {
      setError(t("Something went wrong", "حدث خطأ ما"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString(isArabic ? "ar-EG" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusIndex = (status) =>
    STATUS_FLOW.findIndex((s) => s.key === status);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-amber-50/40 to-stone-50 pb-20 md:pb-12">
        {/* ─── HERO ─────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-9xl">📦</div>
            <div className="absolute bottom-10 right-10 text-9xl">🚚</div>
          </div>
          <div className="container relative py-14 md:py-20">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex justify-center mb-5">
                <Image
                  src="https://pub-233449cd95484981a46fd69460d65453.r2.dev/branding/alsadeq-logo-nobg.png"
                  alt="Al Sadeq Spices"
                  width={90}
                  height={90}
                  className="object-contain drop-shadow-[0_4px_16px_rgba(251,191,36,0.3)]"
                />
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-700/20 border border-amber-700/30 rounded-full px-4 py-1.5 mb-5">
                <span className="text-amber-400">📍</span>
                <span className="text-amber-200 text-xs font-bold uppercase tracking-wider">
                  {t("Live Order Tracking", "تتبع الطلب المباشر")}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
                {t("Track Your Order", "تتبع طلبك")}
              </h1>
              <p className="text-stone-300 text-sm md:text-base">
                {t(
                  "Enter your order number or phone number to see the latest status and full order details.",
                  "أدخل رقم الطلب أو رقم الهاتف لرؤية أحدث حالة وتفاصيل الطلب الكاملة."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ─── SEARCH CARD ─────────────────────────── */}
        <section className="container -mt-10 relative z-10">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-stone-200 p-5 md:p-7">
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {t("Order Number or Phone", "رقم الطلب أو رقم الهاتف")}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                    🔎
                  </span>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t(
                      "e.g. ASQ-123456789 or 7012XXXX",
                      "مثال: ASQ-123456789 أو 7012XXXX"
                    )}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-3 bg-amber-700 text-white font-bold rounded-xl hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading
                    ? t("Searching...", "جاري البحث...")
                    : t("🔍 Track Order", "🔍 تتبع الطلب")}
                </button>
              </div>
              <p className="text-xs text-stone-400">
                {t(
                  "Tip: order number starts with 'ASQ-' and was sent to you on confirmation.",
                  "تلميح: يبدأ رقم الطلب بـ 'ASQ-' وتم إرساله إليك عند التأكيد."
                )}
              </p>
            </form>
          </div>
        </section>

        {/* ─── RESULTS ─────────────────────────── */}
        <section className="container py-10">
          {/* Error */}
          {error && !loading && (
            <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">😕</div>
              <h3 className="font-black text-red-700 mb-1">
                {t("No Order Found", "لم يتم العثور على طلب")}
              </h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Empty initial state */}
          {!searched && !loading && (
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: "🔢",
                  titleEn: "Order Number",
                  titleAr: "رقم الطلب",
                  descEn: "Use the ASQ-xxx number from your confirmation.",
                  descAr: "استخدم رقم ASQ-xxx من رسالة التأكيد.",
                },
                {
                  icon: "📱",
                  titleEn: "Phone Number",
                  titleAr: "رقم الهاتف",
                  descEn: "Or use the phone you placed the order with.",
                  descAr: "أو استخدم الهاتف الذي طلبت به.",
                },
                {
                  icon: "🕐",
                  titleEn: "Real-time Status",
                  titleAr: "الحالة المباشرة",
                  descEn: "See exactly where your spices are right now.",
                  descAr: "اعرف أين بهاراتك الآن بالضبط.",
                },
              ].map((card) => (
                <div
                  key={card.titleEn}
                  className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <h4 className="font-black text-stone-800 text-sm mb-1">
                    {t(card.titleEn, card.titleAr)}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {t(card.descEn, card.descAr)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Orders list */}
          {orders.length > 0 && (
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
              {orders.length > 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-semibold text-center">
                  {t(
                    `Found ${orders.length} orders matching your search`,
                    `تم العثور على ${orders.length} طلبات تطابق بحثك`
                  )}
                </div>
              )}

              {orders.map((order) => {
                const isCancelled = order.status === "cancelled";
                const activeIdx = isCancelled ? -1 : getStatusIndex(order.status);
                const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
                  >
                    {/* HEADER */}
                    <div className="p-5 md:p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                          {t("Order Number", "رقم الطلب")}
                        </p>
                        <p className="text-xl md:text-2xl font-black text-stone-800 font-mono">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          📅 {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {t(
                            order.status.replace(/_/g, " ").toUpperCase(),
                            order.status === "pending"
                              ? "قيد الانتظار"
                              : order.status === "confirmed"
                              ? "مؤكد"
                              : order.status === "preparing"
                              ? "قيد التحضير"
                              : order.status === "out_for_delivery"
                              ? "في الطريق"
                              : order.status === "delivered"
                              ? "تم التوصيل"
                              : order.status === "cancelled"
                              ? "ملغى"
                              : order.status
                          )}
                        </span>
                      </div>
                    </div>

                    {/* TIMELINE */}
                    {!isCancelled && (
                      <div className="p-5 md:p-6 border-b border-stone-100 bg-stone-50/50">
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
                          {t("Order Progress", "تقدم الطلب")}
                        </h4>
                        <div className="relative">
                          {/* Track line */}
                          <div className="absolute top-5 left-5 right-5 h-1 bg-stone-200 rounded-full" />
                          <div
                            className="absolute top-5 left-5 h-1 bg-amber-600 rounded-full transition-all duration-500"
                            style={{
                              width:
                                activeIdx <= 0
                                  ? "0%"
                                  : `calc((100% - 2.5rem) * ${activeIdx} / ${
                                      STATUS_FLOW.length - 1
                                    })`,
                            }}
                          />
                          <div className="relative flex justify-between">
                            {STATUS_FLOW.map((step, idx) => {
                              const done = idx <= activeIdx;
                              const current = idx === activeIdx;
                              return (
                                <div
                                  key={step.key}
                                  className="flex flex-col items-center text-center w-1/5"
                                >
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all ${
                                      done
                                        ? "bg-amber-600 border-amber-600 text-white"
                                        : "bg-white border-stone-300 text-stone-400"
                                    } ${current ? "ring-4 ring-amber-200 scale-110" : ""}`}
                                  >
                                    {done ? "✓" : step.icon}
                                  </div>
                                  <p
                                    className={`mt-2 text-[10px] md:text-xs font-bold ${
                                      done ? "text-stone-800" : "text-stone-400"
                                    }`}
                                  >
                                    {t(step.labelEn, step.labelAr)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="p-5 md:p-6 border-b border-stone-100 bg-red-50/50 text-red-700 text-sm font-semibold flex items-center gap-2">
                        ❌ {t("This order was cancelled.", "تم إلغاء هذا الطلب.")}
                      </div>
                    )}

                    {/* GRID: items + sidebar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      {/* ITEMS */}
                      <div className="md:col-span-2 p-5 md:p-6 border-b md:border-b-0 md:border-r border-stone-100">
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                          {t("Items", "المنتجات")} ({order.items?.length || 0})
                        </h4>
                        <div className="flex flex-col divide-y divide-stone-100">
                          {(order.items || []).map((item) => {
                            const img =
                              item.product?.images?.[0] ||
                              "https://placehold.co/80x80/e7e5e4/78716c?text=🌶️";
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                              >
                                <img
                                  src={img}
                                  alt={item.nameEn}
                                  className="w-14 h-14 rounded-lg object-cover bg-stone-100 flex-shrink-0"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://placehold.co/80x80/e7e5e4/78716c?text=🌶️";
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-stone-800 text-sm truncate">
                                    {isArabic ? item.nameAr : item.nameEn}
                                  </p>
                                  <p className="text-xs text-stone-500">
                                    {item.weight && `${item.weight} · `}
                                    {t("Qty", "الكمية")}: {item.quantity}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-black text-amber-700 text-sm">
                                    {(item.price * item.quantity).toFixed(2)}{" "}
                                    {t("QAR", "ر.ق")}
                                  </p>
                                  <p className="text-xs text-stone-400">
                                    {item.price} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* SIDEBAR */}
                      <div className="p-5 md:p-6 bg-stone-50/40 flex flex-col gap-5">
                        {/* Customer */}
                        {order.customer && (
                          <div>
                            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                              {t("Customer", "العميل")}
                            </h4>
                            <div className="text-sm text-stone-700 flex flex-col gap-1">
                              <p className="font-bold text-stone-800">
                                {order.customer.firstName} {order.customer.lastName}
                              </p>
                              <p className="text-xs text-stone-500">
                                📱 {order.customer.phone}
                              </p>
                              {order.customer.email && (
                                <p className="text-xs text-stone-500 truncate">
                                  ✉️ {order.customer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Address */}
                        {order.customer?.address && (
                          <div>
                            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                              {t("Delivery Address", "عنوان التوصيل")}
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              📍 {order.customer.address}
                              {order.customer.building &&
                                `, ${t("Bldg", "مبنى")} ${order.customer.building}`}
                              {order.customer.floor &&
                                `, ${t("Floor", "طابق")} ${order.customer.floor}`}
                              {order.customer.apartment &&
                                `, ${t("Apt", "شقة")} ${order.customer.apartment}`}
                              {order.customer.city && `, ${order.customer.city}`}
                            </p>
                          </div>
                        )}

                        {/* Totals */}
                        <div>
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                            {t("Summary", "الملخص")}
                          </h4>
                          <div className="text-sm text-stone-700 flex flex-col gap-1.5">
                            <div className="flex justify-between">
                              <span className="text-stone-500">
                                {t("Subtotal", "المجموع الفرعي")}
                              </span>
                              <span className="font-semibold">
                                {Number(order.subtotal).toFixed(2)}{" "}
                                {t("QAR", "ر.ق")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">
                                {t("Delivery", "التوصيل")}
                              </span>
                              <span className="font-semibold">
                                {Number(order.deliveryFee).toFixed(2)}{" "}
                                {t("QAR", "ر.ق")}
                              </span>
                            </div>
                            {Number(order.discountAmount) > 0 && (
                              <div className="flex justify-between text-green-700">
                                <span>{t("Discount", "الخصم")}</span>
                                <span className="font-semibold">
                                  -{Number(order.discountAmount).toFixed(2)}{" "}
                                  {t("QAR", "ر.ق")}
                                </span>
                              </div>
                            )}
                            <div className="border-t border-stone-200 pt-2 mt-1 flex justify-between items-center">
                              <span className="font-black text-stone-800">
                                {t("Total", "الإجمالي")}
                              </span>
                              <span className="font-black text-amber-700 text-lg">
                                {Number(order.grandTotal).toFixed(2)}{" "}
                                {t("QAR", "ر.ق")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment */}
                        <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs">
                          <span className="text-stone-500 font-semibold">
                            {t("Payment", "الدفع")}
                          </span>
                          <span className="font-bold text-stone-800 capitalize">
                            {order.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* CTA */}
              <div className="text-center mt-2">
                <Link
                  href="/shop"
                  className="inline-block px-6 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors text-sm"
                >
                  🛍️ {t("Continue Shopping", "متابعة التسوق")}
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
