"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function ReturnsPage() {
  const { isArabic } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="page-content">
        <div className="bg-stone-900 py-10">
          <div className="container">
            <h1 className="text-3xl font-black text-white">
              {isArabic ? "سياسة الإرجاع والاستبدال" : "Returns & Refunds Policy"}
            </h1>
            <p className="text-stone-400 mt-2 text-sm">
              {isArabic ? "آخر تحديث: مايو 2025" : "Last updated: May 2025"}
            </p>
          </div>
        </div>

        <div className="container py-12 max-w-3xl">
          <div className="prose prose-stone max-w-none space-y-8 text-stone-700">

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "شروط الإرجاع" : "Return Conditions"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "نقبل الإرجاع خلال 48 ساعة من استلام الطلب في الحالات التالية فقط:"
                  : "We accept returns within 48 hours of order receipt in the following cases only:"}
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 leading-relaxed">
                {(isArabic ? [
                  "المنتج تالف أو تضرر أثناء الشحن",
                  "استلام منتج مختلف عما طلبته",
                  "المنتج منتهي الصلاحية",
                ] : [
                  "Product is damaged or spoiled during shipping",
                  "You received a different product than ordered",
                  "Product is past its expiry date",
                ]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "المنتجات غير القابلة للإرجاع" : "Non-Returnable Items"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "نظراً لطبيعة المنتجات الغذائية، لا نقبل إرجاع المنتجات المفتوحة أو المستخدمة، أو في حال تغير رأيك بشأن المنتج."
                  : "Due to the nature of food products, we do not accept returns on opened or used items, or due to a change of mind."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "كيفية طلب الإرجاع" : "How to Request a Return"}
              </h2>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                {(isArabic ? [
                  "تواصل معنا خلال 48 ساعة من الاستلام",
                  "أرسل صورة للمنتج التالف أو الخاطئ",
                  "سيتواصل معك فريقنا لترتيب الاستبدال أو الاسترداد",
                ] : [
                  "Contact us within 48 hours of receiving your order",
                  "Send a photo of the damaged or incorrect item",
                  "Our team will reach out to arrange a replacement or refund",
                ]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "استرداد المبالغ" : "Refunds"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "في حال الموافقة على الإرجاع، يتم رد المبلغ خلال 5-7 أيام عمل إلى وسيلة الدفع الأصلية."
                  : "Upon approval of a return, refunds are processed within 5-7 business days to the original payment method."}
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
