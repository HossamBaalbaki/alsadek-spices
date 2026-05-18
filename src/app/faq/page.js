"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-stone-50 transition-colors"
      >
        <span className="font-semibold text-stone-800 pr-4">{question}</span>
        <span className={`text-amber-700 text-xl flex-shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-stone-50 border-t border-stone-200">
          <p className="text-stone-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { isArabic } = useLanguage();

  const faqs = isArabic
    ? [
        {
          question: "كم يستغرق التوصيل؟",
          answer: "يتم التوصيل في نفس اليوم أو في غضون 24 ساعة لمعظم مناطق قطر. ستجد الوقت التقديري عند اختيار منطقتك في صفحة الدفع.",
        },
        {
          question: "ما هي طرق الدفع المتاحة؟",
          answer: "نقبل الدفع نقداً عند الاستلام، وبطاقات الفيزا والماستركارد، وApple Pay.",
        },
        {
          question: "هل يمكنني تعديل طلبي بعد تقديمه؟",
          answer: "يمكنك التواصل معنا فور تقديم الطلب لطلب التعديل. إذا لم يكن الطلب قد بدأ في التجهيز بعد، سنبذل قصارى جهدنا لتلبية طلبك.",
        },
        {
          question: "هل منتجاتكم طازجة وطبيعية؟",
          answer: "نعم، جميع بهاراتنا طازجة ومصدرها مختار بعناية. نحرص على الجودة في كل خطوة من خطوات التوريد والتعبئة.",
        },
        {
          question: "هل تتوفر باقات هدايا؟",
          answer: "نعم! لدينا تشكيلة من باقات الهدايا الجاهزة. يمكنك استعراضها في قسم 'المتجر' وتصفية النتائج باختيار 'باقة / عرض'.",
        },
        {
          question: "ماذا أفعل إذا تلقيت منتجاً تالفاً؟",
          answer: "تواصل معنا فوراً خلال 48 ساعة مع صورة للمنتج، وسنقوم باستبداله أو استرداد المبلغ بالكامل.",
        },
      ]
    : [
        {
          question: "How long does delivery take?",
          answer: "Delivery is same-day or within 24 hours for most areas in Qatar. You will see an estimated delivery time when selecting your zone at checkout.",
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept cash on delivery, Visa, Mastercard, and Apple Pay.",
        },
        {
          question: "Can I modify my order after placing it?",
          answer: "Contact us immediately after placing your order to request changes. If preparation has not started, we will do our best to accommodate your request.",
        },
        {
          question: "Are your products fresh and natural?",
          answer: "Yes, all our spices are fresh and sourced with care. We maintain quality at every step of procurement and packaging.",
        },
        {
          question: "Do you offer gift bundles?",
          answer: "Yes! We have a selection of ready-made gift bundles. Browse them in the Shop section and filter by 'Bundle / Package'.",
        },
        {
          question: "What if I receive a damaged product?",
          answer: "Contact us within 48 hours with a photo of the item, and we will arrange a full replacement or refund.",
        },
      ];

  return (
    <>
      <Navbar />
      <main className="page-content">
        <div className="bg-stone-900 py-10">
          <div className="container">
            <h1 className="text-3xl font-black text-white">
              {isArabic ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h1>
          </div>
        </div>

        <div className="container py-12 max-w-3xl">
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
