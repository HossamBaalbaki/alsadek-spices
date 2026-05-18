"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/shop/ProductGrid";

function OrderConfirmationContent() {
  const { t, isArabic } = useLanguage();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    if (orderNumber) {
      const savedOrder = localStorage.getItem(`order_${orderNumber}`);
      if (savedOrder) setOrder(JSON.parse(savedOrder));
    } else {
      const lastOrder = localStorage.getItem("lastOrder");
      if (lastOrder) setOrder(JSON.parse(lastOrder));
    }
    setLoading(false);
    fetch("/api/products?sort=bestSeller&limit=4")
      .then((r) => r.json())
      .then((d) => { if (d.success) setFeatured(d.data); })
      .catch(() => {});
  }, [orderNumber]);

  const getPaymentLabel = () => {
    if (!order) return "";
    switch (order.paymentMethod) {
      case "cash": return isArabic ? "الدفع عند الاستلام" : "Cash on Delivery";
      case "card": return isArabic ? "بطاقة ائتمان" : "Credit Card";
      case "apple_pay": return "Apple Pay";
      case "whatsapp": return isArabic ? "طلب عبر واتساب" : "WhatsApp Order";
      default: return order.paymentMethod;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isArabic ? "ar-QA" : "en-QA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl animate-bounce mb-4">🌶️</div>
        <p className="text-stone-500">
          {isArabic ? "جاري التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20">
        <div className="empty-state">
          <div className="text-8xl">📦</div>
          <div>
            <h2 className="text-2xl font-black text-stone-800 mb-2">
              {isArabic ? "الطلب غير موجود" : "Order Not Found"}
            </h2>
            <p className="text-stone-400">
              {isArabic
                ? "لم نتمكن من العثور على طلبك"
                : "We could not find your order"}
            </p>
          </div>
          <Link href="/shop" className="btn btn-primary btn-lg">
            {isArabic ? "تسوق الآن" : "Shop Now"}
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = [
    {
      titleEn: "Order Placed",
      titleAr: "تم تقديم الطلب",
      descEn: "Your order has been received",
      descAr: "تم استلام طلبك",
      icon: "✅",
      completed: true,
      active: false,
    },
    {
      titleEn: "Order Confirmed",
      titleAr: "تم تأكيد الطلب",
      descEn: "We are preparing your order",
      descAr: "نحن نجهز طلبك",
      icon: "📦",
      completed: false,
      active: true,
    },
    {
      titleEn: "Out for Delivery",
      titleAr: "في الطريق إليك",
      descEn: "Your order is on the way",
      descAr: "طلبك في الطريق إليك",
      icon: "🚚",
      completed: false,
      active: false,
    },
    {
      titleEn: "Delivered",
      titleAr: "تم التوصيل",
      descEn: "Order delivered successfully",
      descAr: "تم توصيل الطلب بنجاح",
      icon: "🎉",
      completed: false,
      active: false,
    },
  ];

  return (
    <>
      {/* ─── SUCCESS HEADER ─────────────────────────── */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 py-16">
        <div className="container text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
            {isArabic ? "تم تأكيد طلبك! 🎉" : "Order Confirmed! 🎉"}
          </h1>
          <p className="text-green-100 text-lg mb-6">
            {isArabic
              ? "شكراً لك! سنتواصل معك قريباً لتأكيد التوصيل"
              : "Thank you! We will contact you soon to confirm delivery"}
          </p>
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3">
            <span className="text-green-100 text-sm font-medium">
              {isArabic ? "رقم الطلب:" : "Order Number:"}
            </span>
            <span className="text-white font-black text-xl tracking-wider">
              {order.orderNumber}
            </span>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────── */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── LEFT ─────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="font-black text-stone-900 text-lg mb-6">
                {isArabic ? "حالة الطلب" : "Order Status"}
              </h2>
              <div className="status-timeline">
                {statusSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`status-step ${step.completed ? "completed" : ""} ${step.active ? "active" : ""}`}
                  >
                    <div className="status-icon">
                      {step.completed || step.active ? (
                        <span className="text-sm">{step.icon}</span>
                      ) : (
                        <span className="text-xs text-stone-400">{index + 1}</span>
                      )}
                    </div>
                    <div className="status-content">
                      <p className={`font-bold text-sm ${step.completed || step.active ? "text-stone-800" : "text-stone-400"}`}>
                        {isArabic ? step.titleAr : step.titleEn}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {isArabic ? step.descAr : step.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="font-black text-stone-900 text-lg mb-4">
                {isArabic ? "المنتجات المطلوبة" : "Ordered Items"}
              </h2>
              <div className="flex flex-col gap-3">
                {order.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center gap-4 py-3 border-b border-stone-100 last:border-0"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🌶️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-stone-800 text-sm">
                        {isArabic ? item.nameAr : item.nameEn}
                      </p>
                      {item.weight && (
                        <p className="text-xs text-stone-400">{item.weight}</p>
                      )}
                      <p className="text-xs text-stone-500 mt-0.5">
                        {item.quantity} x {item.price} {t.general.qar}
                      </p>
                    </div>
                    <p className="font-black text-stone-800">
                      {(item.price * item.quantity).toFixed(2)} {t.general.qar}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-4 pt-4 border-t border-stone-200 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">
                    {isArabic ? "المجموع الفرعي" : "Subtotal"}
                  </span>
                  <span className="font-semibold">
                    {order.subtotal.toFixed(2)} {t.general.qar}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">
                    {isArabic ? "رسوم التوصيل" : "Delivery Fee"}
                  </span>
                  <span className={`font-semibold ${order.deliveryFee === 0 ? "text-green-600" : ""}`}>
                    {order.deliveryFee === 0
                      ? isArabic ? "مجاني 🎉" : "Free 🎉"
                      : `${order.deliveryFee} ${t.general.qar}`}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      {isArabic ? "الخصم" : "Discount"}
                    </span>
                    <span className="font-semibold text-green-600">
                      -{order.discountAmount.toFixed(2)} {t.general.qar}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-black text-lg pt-2 border-t border-stone-200">
                  <span>{isArabic ? "الإجمالي" : "Total"}</span>
                  <span>{order.grandTotal.toFixed(2)} {t.general.qar}</span>
                </div>
              </div>
            </div>

            {/* Customer + Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <span>👤</span>
                  {isArabic ? "معلومات العميل" : "Customer Info"}
                </h3>
                <p className="font-semibold text-stone-800">
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <p className="text-sm text-stone-600">📞 {order.customer.phone}</p>
                {order.customer.email && (
                  <p className="text-sm text-stone-600">✉️ {order.customer.email}</p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <span>🚚</span>
                  {isArabic ? "عنوان التوصيل" : "Delivery Address"}
                </h3>
                <p className="text-sm text-stone-600">
                  📍 {order.customer.address}
                  {order.customer.building && `, Bldg ${order.customer.building}`}
                  {order.customer.floor && `, Floor ${order.customer.floor}`}
                  {order.customer.apartment && `, Apt ${order.customer.apartment}`}
                </p>
                <p className="text-sm text-stone-600">🏙️ {order.customer.city}</p>
                {order.customer.notes && (
                  <p className="text-xs text-stone-400 italic mt-1">
                    💬 {order.customer.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                <span>💳</span>
                {isArabic ? "طريقة الدفع" : "Payment Method"}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <span className="text-xl">
                    {order.paymentMethod === "cash" ? "💵"
                      : order.paymentMethod === "card" ? "💳"
                      : order.paymentMethod === "apple_pay" ? "🍎"
                      : "💬"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{getPaymentLabel()}</p>
                  <p className="text-xs text-stone-400">
                                    {order.paymentMethod === "cash"
                      ? isArabic ? "ادفع عند وصول طلبك" : "Pay when your order arrives"
                      : isArabic ? "تم تأكيد الدفع" : "Payment confirmed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Date */}
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 flex items-center justify-between">
              <span className="text-sm text-stone-500">
                {isArabic ? "تاريخ الطلب:" : "Order Date:"}
              </span>
              <span className="text-sm font-semibold text-stone-700">
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>

          {/* ─── RIGHT ─────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* WhatsApp */}
            {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
            <div className="bg-[#25d366] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <div>
                  <p className="font-black text-lg">
                    {isArabic ? "تأكيد عبر واتساب" : "WhatsApp Confirmation"}
                  </p>
                  <p className="text-green-100 text-xs">
                    {isArabic ? "أرسل تفاصيل طلبك" : "Send your order details"}
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  isArabic
                    ? `مرحباً، لدي طلب جديد:\nرقم الطلب: ${order.orderNumber}\nالإجمالي: ${order.grandTotal.toFixed(2)} ر.ق`
                    : `Hello, I have a new order:\nOrder Number: ${order.orderNumber}\nTotal: ${order.grandTotal.toFixed(2)} QAR`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-white text-[#25d366] hover:bg-green-50 border-white w-full justify-center font-bold"
              >
                {isArabic ? "أرسل عبر واتساب" : "Send via WhatsApp"}
              </a>
            </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-bold text-stone-800 mb-4">
                {isArabic ? "الإجراءات السريعة" : "Quick Actions"}
              </h3>
              <div className="flex flex-col gap-3">
                <Link
                  href="/shop"
                  className="btn btn-primary btn-full justify-center"
                >
                  {isArabic ? "متابعة التسوق" : "Continue Shopping"}
                </Link>
                <Link
                  href="/"
                  className="btn btn-outline btn-full justify-center"
                >
                  {isArabic ? "الصفحة الرئيسية" : "Go to Home"}
                </Link>
                <button
                  onClick={() => window.print()}
                  className="btn btn-ghost btn-full justify-center"
                >
                  {isArabic ? "طباعة الطلب" : "Print Order"}
                </button>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <span>🚚</span>
                {isArabic ? "وقت التوصيل المتوقع" : "Estimated Delivery"}
              </h3>
              <p className="text-amber-700 font-black text-2xl mb-1">
                {order.deliveryZone
                  ? isArabic
                    ? order.deliveryZone.estimatedTimeAr
                    : order.deliveryZone.estimatedTime
                  : isArabic
                  ? "1-3 ساعات"
                  : "1-3 Hours"}
              </p>
              <p className="text-amber-600 text-sm">
                {isArabic
                  ? "سيتصل بك السائق قبل الوصول"
                  : "Driver will call before arrival"}
              </p>
            </div>

            {/* Need Help */}
            {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 text-center">
              <p className="text-stone-600 text-sm mb-3">
                {isArabic ? "هل تحتاج مساعدة؟" : "Need help with your order?"}
              </p>
              <a
                href={`tel:+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                className="btn btn-outline btn-full justify-center"
              >
                {isArabic ? "اتصل بنا" : "Call Us"}
              </a>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── YOU MIGHT ALSO LIKE ─────────────────────────── */}
      {featured.length > 0 && (
        <div className="container py-8">
          <div className="section-header mb-4">
            <h2 className="text-xl font-black text-stone-900">
              {isArabic ? "قد يعجبك أيضاً" : "You Might Also Like"}
            </h2>
            <Link href="/shop" className="text-sm font-semibold text-amber-700 hover:text-amber-900">
              {isArabic ? "عرض الكل" : "View all"}
            </Link>
          </div>
          <ProductGrid products={featured} loading={false} columns="default" />
        </div>
      )}
    </>
  );
}

export default function OrderConfirmationPage() {
  return (
    <>
      <Navbar />
      <main className="page-content">
        <Suspense
          fallback={
            <div className="container py-20 text-center">
              <div className="text-6xl animate-bounce mb-4">🌶️</div>
            </div>
          }
        >
          <OrderConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}