"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const STATUS_FLOW = [
  { key: "pending",          labelEn: "Order Placed",      labelAr: "تم تقديم الطلب",    icon: "📋" },
  { key: "confirmed",        labelEn: "Confirmed",          labelAr: "مؤكد",               icon: "✅" },
  { key: "preparing",        labelEn: "Preparing",          labelAr: "قيد التحضير",        icon: "👨‍🍳" },
  { key: "out_for_delivery", labelEn: "Out for Delivery",   labelAr: "في الطريق",          icon: "🚚" },
  { key: "delivered",        labelEn: "Delivered",          labelAr: "تم التوصيل",         icon: "🎉" },
];

const STATUS_COLOR = {
  pending:          "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed:        "bg-blue-100 text-blue-800 border-blue-200",
  preparing:        "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-orange-100 text-orange-800 border-orange-200",
  delivered:        "bg-green-100 text-green-800 border-green-200",
  cancelled:        "bg-red-100 text-red-800 border-red-200",
};

export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const { isArabic } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t = (en, ar) => (isArabic ? ar : en);

  useEffect(() => {
    if (!orderNumber) return;
    setLoading(true);
    fetch(`/api/track?query=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setOrder(data.data[0]);
        } else {
          setError(data.message || t("Order not found", "الطلب غير موجود"));
        }
      })
      .catch(() => setError(t("Failed to load order", "فشل تحميل الطلب")))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const currentStepIndex = order
    ? STATUS_FLOW.findIndex((s) => s.key === order.status)
    : -1;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(isArabic ? "ar-QA" : "en-QA", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <>
      <Navbar />
      <main className="page-content">
        {/* Header */}
        <div className="bg-stone-900 py-8">
          <div className="container">
            <div className="flex items-center gap-3 mb-1">
              <Link href="/track" className="text-stone-400 hover:text-white text-sm transition-colors">
                {t("Track Orders", "تتبع الطلبات")}
              </Link>
              <span className="text-stone-600">›</span>
              <span className="text-white text-sm font-mono">{orderNumber}</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {t("Order Tracking", "تتبع الطلب")}
            </h1>
          </div>
        </div>

        <div className="container py-8">
          {loading && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="empty-state">
              <div className="text-6xl">📦</div>
              <div>
                <h2 className="text-xl font-black text-stone-800 mb-2">{error}</h2>
                <p className="text-stone-400 text-sm">
                  {t("Check your order number and try again.", "تحقق من رقم الطلب وحاول مرة أخرى.")}
                </p>
              </div>
              <Link href="/track" className="btn btn-primary">{t("Search Again", "بحث مرة أخرى")}</Link>
            </div>
          )}

          {order && (
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              {/* Status Badge */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">
                      {t("Order Number", "رقم الطلب")}
                    </p>
                    <p className="text-xl font-black text-stone-900 font-mono">{order.orderNumber}</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${STATUS_COLOR[order.status] || "bg-stone-100 text-stone-700 border-stone-200"}`}>
                    {STATUS_FLOW.find((s) => s.key === order.status)?.[isArabic ? "labelAr" : "labelEn"] || order.status}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="status-timeline">
                  {STATUS_FLOW.map((step, idx) => {
                    const done = idx < currentStepIndex;
                    const active = idx === currentStepIndex;
                    return (
                      <div key={step.key} className={`status-step ${done ? "completed" : ""} ${active ? "active" : ""}`}>
                        <div className="status-icon">
                          {done || active
                            ? <span className="text-sm">{step.icon}</span>
                            : <span className="text-xs text-stone-400">{idx + 1}</span>}
                        </div>
                        <div className="status-content">
                          <p className={`font-bold text-sm ${done || active ? "text-stone-800" : "text-stone-400"}`}>
                            {isArabic ? step.labelAr : step.labelEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-400">
                  {t("Placed", "تم الطلب")} {formatDate(order.createdAt)}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <h2 className="font-black text-stone-900 mb-4">{t("Items", "المنتجات")}</h2>
                <div className="flex flex-col gap-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-xl">🌶️</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm">
                          {isArabic ? item.nameAr : item.nameEn}
                        </p>
                        {item.weight && <p className="text-xs text-stone-400">{item.weight}</p>}
                      </div>
                      <p className="text-sm font-bold text-stone-800">
                        {item.quantity} × {Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between font-black text-lg">
                  <span>{t("Total", "الإجمالي")}</span>
                  <span>{Number(order.grandTotal || 0).toFixed(2)} {t("QAR", "ر.ق")}</span>
                </div>
              </div>

              {/* Delivery Info */}
              {order.customer && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h2 className="font-black text-stone-900 mb-3">{t("Delivery To", "التوصيل إلى")}</h2>
                  <p className="font-semibold text-stone-800">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p className="text-sm text-stone-600 mt-1">📍 {order.customer.address}, {order.customer.city}</p>
                  <p className="text-sm text-stone-600">📞 {order.customer.phone}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/shop" className="btn btn-primary flex-1 justify-center">
                  {t("Continue Shopping", "متابعة التسوق")}
                </Link>
                <Link href="/track" className="btn btn-outline flex-1 justify-center">
                  {t("Track Another", "تتبع طلب آخر")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
