"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const WHATSAPP_NUMBER = "97430000000"; // replace with real number

const INFO_CARDS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    labelEn: "Phone",
    labelAr: "الهاتف",
    valueEn: "+974 3000 0000",
    valueAr: "٩٧٤ ٣٠٠٠ ٠٠٠٠+",
    href: "tel:+97430000000",
    color: "amber",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    labelEn: "WhatsApp",
    labelAr: "واتساب",
    valueEn: "+974 3000 0000",
    valueAr: "٩٧٤ ٣٠٠٠ ٠٠٠٠+",
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    color: "green",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    labelEn: "Email",
    labelAr: "البريد الإلكتروني",
    valueEn: "info@alsadek.qa",
    valueAr: "info@alsadek.qa",
    href: "mailto:info@alsadek.qa",
    color: "blue",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    labelEn: "Location",
    labelAr: "الموقع",
    valueEn: "Doha, Qatar",
    valueAr: "الدوحة، قطر",
    href: "https://maps.google.com/?q=Doha,Qatar",
    color: "red",
  },
];

const COLOR_MAP = {
  amber: { bg: "bg-amber-50", icon: "text-amber-700", border: "border-amber-100" },
  green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
};

export default function ContactPage() {
  const { isArabic } = useLanguage();

  const [form, setForm] = useState({ name: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = isArabic
      ? `مرحباً، أنا ${form.name}\nالهاتف: ${form.phone}\nالموضوع: ${form.subject}\n\n${form.message}`
      : `Hello, I'm ${form.name}\nPhone: ${form.phone}\nSubject: ${form.subject}\n\n${form.message}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: "", phone: "", subject: "", message: "" });
  };

  const t = {
    en: {
      hero: "Get in Touch",
      heroSub: "We're here to help. Reach out and we'll get back to you as soon as possible.",
      hours: "Working Hours",
      hoursSun: "Sunday – Thursday",
      hoursSunVal: "9:00 AM – 8:00 PM",
      hoursFri: "Friday – Saturday",
      hoursFriVal: "2:00 PM – 10:00 PM",
      formTitle: "Send a Message",
      name: "Full Name",
      namePh: "Your name",
      phone: "Phone Number",
      phonePh: "+974 XXXX XXXX",
      subject: "Subject",
      subjectPh: "How can we help?",
      message: "Message",
      messagePh: "Write your message here...",
      submit: "Send via WhatsApp",
      successMsg: "Message sent! We'll respond shortly.",
      followUs: "Follow Us",
    },
    ar: {
      hero: "تواصل معنا",
      heroSub: "نحن هنا للمساعدة. تواصل معنا وسنرد عليك في أقرب وقت ممكن.",
      hours: "ساعات العمل",
      hoursSun: "الأحد – الخميس",
      hoursSunVal: "٩:٠٠ ص – ٨:٠٠ م",
      hoursFri: "الجمعة – السبت",
      hoursFriVal: "٢:٠٠ م – ١٠:٠٠ م",
      formTitle: "أرسل رسالة",
      name: "الاسم الكامل",
      namePh: "اسمك",
      phone: "رقم الهاتف",
      phonePh: "٩٧٤ XXXX XXXX+",
      subject: "الموضوع",
      subjectPh: "كيف يمكننا مساعدتك؟",
      message: "الرسالة",
      messagePh: "اكتب رسالتك هنا...",
      submit: "إرسال عبر واتساب",
      successMsg: "تم الإرسال! سنرد عليك قريباً.",
      followUs: "تابعنا",
    },
  };

  const tx = isArabic ? t.ar : t.en;

  return (
    <>
      <Navbar />
      <main className="page-content">

        {/* ─── HERO ─────────────────────────── */}
        <section className="bg-stone-900 py-16">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 bg-amber-700/20 border border-amber-700/30 rounded-full px-4 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-400 text-sm font-semibold tracking-wide">
                {isArabic ? "الصادق للبهارات" : "Al Sadeq Spices"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              {tx.hero}
            </h1>
            <p className="text-stone-400 text-lg max-w-xl mx-auto">{tx.heroSub}</p>
          </div>
        </section>

        {/* ─── INFO CARDS ─────────────────────────── */}
        <section className="bg-white border-b border-stone-100 py-10">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INFO_CARDS.map((card) => {
                const c = COLOR_MAP[card.color];
                return (
                  <a
                    key={card.labelEn}
                    href={card.href}
                    target={card.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center text-center gap-3 p-5 rounded-2xl border ${c.bg} ${c.border} hover:shadow-md transition-all duration-200 group`}
                  >
                    <div className={`${c.icon} group-hover:scale-110 transition-transform duration-200`}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-0.5">
                        {isArabic ? card.labelAr : card.labelEn}
                      </p>
                      <p className="text-sm font-bold text-stone-800">
                        {isArabic ? card.valueAr : card.valueEn}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── FORM + HOURS ─────────────────────────── */}
        <section className="py-14 bg-stone-50">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

              {/* Contact Form */}
              <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
                <h2 className="text-xl font-black text-stone-900 mb-6">{tx.formTitle}</h2>

                {submitted && (
                  <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {tx.successMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1.5">{tx.name} *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder={tx.namePh}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1.5">{tx.phone} *</label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        placeholder={tx.phonePh}
                        className="input w-full text-sm"
                        type="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">{tx.subject} *</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      placeholder={tx.subjectPh}
                      className="input w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">{tx.message} *</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      placeholder={tx.messagePh}
                      rows={5}
                      className="input w-full text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg justify-center flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {tx.submit}
                  </button>
                </form>
              </div>

              {/* Right Side — Hours + Map */}
              <div className="flex flex-col gap-6">

                {/* Working Hours */}
                <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-black text-stone-900">{tx.hours}</h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between py-3 border-b border-stone-100">
                      <span className="text-sm font-semibold text-stone-700">{tx.hoursSun}</span>
                      <span className="text-sm font-bold text-amber-700">{tx.hoursSunVal}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-semibold text-stone-700">{tx.hoursFri}</span>
                      <span className="text-sm font-bold text-amber-700">{tx.hoursFriVal}</span>
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex-1 min-h-[220px]">
                  <iframe
                    title="Al Sadeq Spices Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d462560.6828613893!2d51.20653!3d25.285447!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e45c534ffdce87f%3A0x3ad7e7b5c1a22c4!2sDoha%2C%20Qatar!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: 220 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── BOTTOM CTA STRIP ─────────────────────────── */}
        <section className="bg-amber-700 py-10">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-black text-xl">
                {isArabic ? "جاهز للطلب؟" : "Ready to order?"}
              </p>
              <p className="text-amber-200 text-sm mt-0.5">
                {isArabic
                  ? "تصفح مجموعتنا من البهارات الفاخرة"
                  : "Browse our premium spice collection"}
              </p>
            </div>
            <Link href="/shop" className="btn bg-white text-amber-800 hover:bg-amber-50 border-white font-bold px-6 py-2.5 rounded-xl">
              {isArabic ? "تسوق الآن" : "Shop Now"}
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
