"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t, isArabic } = useLanguage();

  const currentYear = new Date().getFullYear();

  // ─── QUICK LINKS ───────────────────────────
  const quickLinks = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.shop, href: "/shop" },
    { label: t.nav.offers, href: "/shop?filter=sale" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  // ─── CUSTOMER SERVICE LINKS ───────────────────────────
  const serviceLinks = [
    { label: t.footer.trackOrder, href: "/track" },
    { label: t.footer.faq, href: "/faq" },
    { label: t.footer.returns, href: "/returns" },
    { label: t.footer.privacy, href: "/privacy" },
    { label: t.footer.terms, href: "/terms" },
  ];

  // ─── SOCIAL MEDIA ─────────────────────────────────────────────────────────
  // Links are hidden when the corresponding env var is not set.
  const waNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const rawSocialLinks = [
    process.env.NEXT_PUBLIC_INSTAGRAM_URL && {
      name: "Instagram",
      href: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    process.env.NEXT_PUBLIC_FACEBOOK_URL && {
      name: "Facebook",
      href: process.env.NEXT_PUBLIC_FACEBOOK_URL,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    waNum && {
      name: "WhatsApp",
      href: `https://wa.me/${waNum}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    process.env.NEXT_PUBLIC_TIKTOK_URL && {
      name: "TikTok",
      href: process.env.NEXT_PUBLIC_TIKTOK_URL,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
        </svg>
      ),
    },
  ];
  const socialLinks = rawSocialLinks.filter(Boolean);

  return (
    <footer className="bg-stone-900 text-stone-300">
      {/* ─── MAIN FOOTER ─────────────────────────── */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* ─── BRAND COLUMN ─────────────────────────── */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center">
                <span className="text-white text-xl">🌶️</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-lg text-white tracking-tight">
                  {isArabic ? "الصادق" : "Al Sadek"}
                </span>
                <span className="text-xs text-amber-500 font-semibold tracking-wide">
                  {isArabic ? "للبهارات" : "SPICES"}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-stone-400 leading-relaxed mb-6">
              {t.footer.description}
            </p>

            {/* Social Media */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                {t.footer.followUs}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-amber-700 transition-all duration-200"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ─── QUICK LINKS ─────────────────────────── */}
          <div>
            <p className="text-sm font-bold text-white mb-4">
              {t.footer.quickLinks}
            </p>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 hover:text-amber-400 transition-colors duration-150 flex items-center gap-2"
                  >
                    <span className="text-amber-700 text-xs">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── CUSTOMER SERVICE ─────────────────────────── */}
          <div>
            <p className="text-sm font-bold text-white mb-4">
              {t.footer.customerService}
            </p>
            <ul className="flex flex-col gap-2">
              {serviceLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 hover:text-amber-400 transition-colors duration-150 flex items-center gap-2"
                  >
                    <span className="text-amber-700 text-xs">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── CONTACT INFO ─────────────────────────── */}
          <div>
            <p className="text-sm font-bold text-white mb-4">
              {t.footer.contactUs}
            </p>

            <ul className="flex flex-col gap-3">
              {/* Phone */}
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-0.5">
                    {isArabic ? "الهاتف" : "Phone"}
                  </p>
                  <a
                    href={`tel:${t.footer.phone}`}
                    className="text-sm text-stone-300 hover:text-amber-400 transition-colors"
                                      >
                    {t.footer.phone}
                  </a>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-0.5">
                    {isArabic ? "البريد الإلكتروني" : "Email"}
                  </p>
                  <a
                    href={`mailto:${t.footer.email}`}
                    className="text-sm text-stone-300 hover:text-amber-400 transition-colors"
                  >
                    {t.footer.email}
                  </a>
                </div>
              </li>

              {/* Address */}
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-0.5">
                    {isArabic ? "العنوان" : "Address"}
                  </p>
                  <p className="text-sm text-stone-300">
                    {t.footer.address}
                  </p>
                </div>
              </li>

              {/* Working Hours */}
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-0.5">
                    {t.footer.workingHours}
                  </p>
                  <p className="text-sm text-stone-300">
                    {t.footer.hours}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM BAR — payment + copyright merged ─────────────────────────── */}
      <div className="border-t border-stone-800">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Payment Icons */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-stone-500 mr-1">
                {isArabic ? "طرق الدفع:" : "We Accept:"}
              </p>
              <div className="bg-white rounded px-2 py-1 flex items-center justify-center h-7">
                <span className="text-blue-800 font-black text-xs tracking-tight">VISA</span>
              </div>
              <div className="bg-white rounded px-2 py-1 flex items-center justify-center h-7 gap-1">
                <div className="w-4 h-4 rounded-full bg-red-500 opacity-90" />
                <div className="w-4 h-4 rounded-full bg-yellow-400 opacity-90 -ml-2" />
              </div>
              <div className="bg-white rounded px-2 py-1 flex items-center justify-center h-7">
                <span className="text-black font-semibold text-xs">Apple Pay</span>
              </div>
              <div className="bg-stone-700 rounded px-2 py-1 flex items-center justify-center h-7">
                <span className="text-stone-200 font-semibold text-xs">
                  {isArabic ? "كاش" : "Cash"}
                </span>
              </div>
            </div>

            {/* Copyright */}
            <div className="flex flex-col sm:items-end gap-1 text-xs text-stone-500">
              <p>
                © {currentYear}{" "}
                {isArabic ? "الصادق للبهارات" : "Al Sadek Spices"}.{" "}
                {t.footer.allRights}
              </p>
              <p>{t.footer.madeWith}</p>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}