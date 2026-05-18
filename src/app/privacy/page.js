"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
  const { isArabic } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="page-content">
        <div className="bg-stone-900 py-10">
          <div className="container">
            <h1 className="text-3xl font-black text-white">
              {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
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
                {isArabic ? "المعلومات التي نجمعها" : "Information We Collect"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "نجمع المعلومات التي تقدمها مباشرة عند تقديم طلبك، مثل اسمك ورقم هاتفك وعنوانك وبريدك الإلكتروني. لا نجمع بيانات الدفع — يتم معالجتها من قِبل مزود خدمة الدفع المعتمد."
                  : "We collect information you provide directly when placing an order, such as your name, phone number, address, and email. We do not collect payment card data — that is processed by a certified payment provider."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "كيف نستخدم بياناتك" : "How We Use Your Data"}
              </h2>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                {(isArabic ? [
                  "معالجة وتوصيل طلباتك",
                  "التواصل معك بشأن حالة طلبك",
                  "تحسين خدماتنا وتجربة التسوق",
                  "الامتثال للمتطلبات القانونية",
                ] : [
                  "Processing and delivering your orders",
                  "Communicating with you about your order status",
                  "Improving our services and shopping experience",
                  "Complying with legal requirements",
                ]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "مشاركة البيانات" : "Data Sharing"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك معلوماتك فقط مع موفري الخدمات اللازمين لإتمام طلبك (مثل شركات التوصيل)."
                  : "We do not sell your personal data to any third party. We may share your information only with service providers necessary to fulfil your order (such as delivery partners)."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "الاحتفاظ بالبيانات" : "Data Retention"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "نحتفظ ببيانات طلبك لمدة تصل إلى 3 سنوات لأغراض الفوترة والضريبة. يمكنك طلب حذف بياناتك في أي وقت عبر التواصل معنا."
                  : "We retain your order data for up to 3 years for billing and tax purposes. You may request deletion of your data at any time by contacting us."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "الأمان" : "Security"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "نستخدم تقنية التشفير HTTPS لحماية بياناتك أثناء النقل. تُخزَّن البيانات على خوادم آمنة."
                  : "We use HTTPS encryption to protect your data in transit. Data is stored on secure servers."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {isArabic ? "تواصل معنا" : "Contact Us"}
              </h2>
              <p className="leading-relaxed">
                {isArabic
                  ? "لأي استفسارات تتعلق بخصوصيتك، يرجى التواصل معنا عبر صفحة الاتصال."
                  : "For any privacy-related questions, please reach out via our contact page."}
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
