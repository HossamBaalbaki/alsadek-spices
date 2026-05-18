"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const { isArabic } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="page-content">
        <div className="bg-stone-900 py-10">
          <div className="container">
            <h1 className="text-3xl font-black text-white">
              {isArabic ? "الشروط والأحكام" : "Terms & Conditions"}
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
                {isArabic ? "قبول الشروط" : "Acceptance of Terms"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "باستخدامك لموقع الصادق للبهارات أو إجرائك لأي عملية شراء، فإنك توافق على الالتزام بهذه الشروط والأحكام."
                  : "By using the Al Sadek Spices website or placing a purchase, you agree to be bound by these Terms and Conditions."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "الطلبات والأسعار" : "Orders & Pricing"}
              </h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                {(isArabic ? [
                  "جميع الأسعار بالريال القطري وتشمل ضريبة القيمة المضافة المطبقة.",
                  "نحتفظ بحق رفض أي طلب أو إلغائه في حال نفاد المخزون.",
                  "يتم تأكيد الطلب فور استلامه وسيتواصل معك فريقنا للتأكيد.",
                  "الأسعار عرضة للتغيير دون إشعار مسبق.",
                ] : [
                  "All prices are in Qatari Riyals and include applicable taxes.",
                  "We reserve the right to refuse or cancel any order if stock is unavailable.",
                  "Orders are confirmed upon receipt and our team will contact you for confirmation.",
                  "Prices are subject to change without prior notice.",
                ]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "التوصيل" : "Delivery"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "نوصّل داخل قطر فقط. أوقات التوصيل تقديرية وقد تتأثر بظروف خارجة عن إرادتنا. نحن غير مسؤولين عن التأخيرات الناتجة عن ظروف قوة قاهرة."
                  : "We deliver within Qatar only. Delivery times are estimates and may be affected by circumstances beyond our control. We are not liable for delays caused by force majeure."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "المنتجات" : "Products"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "نسعى جاهدين لضمان دقة صور المنتجات وأوصافها، غير أنها قد تختلف قليلاً عن المنتج الفعلي. إذا كان المنتج لا يلبي توقعاتك، يرجى مراجعة سياسة الإرجاع."
                  : "We strive to ensure product images and descriptions are accurate, but they may vary slightly from the actual product. If a product does not meet your expectations, please refer to our Returns Policy."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "تحديد المسؤولية" : "Limitation of Liability"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "لن تكون الصادق للبهارات مسؤولة عن أي أضرار غير مباشرة أو عرضية تنشأ عن استخدام منتجاتنا أو خدماتنا."
                  : "Al Sadek Spices shall not be liable for any indirect or incidental damages arising from the use of our products or services."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "القانون المطبق" : "Governing Law"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "تخضع هذه الشروط لقوانين دولة قطر."
                  : "These terms are governed by the laws of the State of Qatar."}
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
