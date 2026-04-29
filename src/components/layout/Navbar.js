"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function Navbar() {
  const { t, isArabic } = useLanguage();
  const { cartCount } = useCart();
  const [mounted, setMounted] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const prevCartCountRef = useRef(cartCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 500);
      prevCartCountRef.current = cartCount;
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/site-settings", { cache: "no-store" });
        const data = await res.json();
        if (data.success) setSiteSettings(data.data);
      } catch {}
    };
    loadSettings();
  }, []);

  const navLinks = [
    { label: isArabic ? "الرئيسية" : "Home", href: "/" },
    { label: isArabic ? "المتجر" : "Shop", href: "/shop" },
    { label: isArabic ? "من نحن" : "About", href: "/about" },
    { label: isArabic ? "تواصل معنا" : "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* ─── TOP BANNER ─────────────────────────── */}
      <div className="offer-banner">
        <p>
          🌶️{" "}
          {isArabic
            ? (siteSettings?.topBannerAr || "توصيل مجاني للطلبات فوق 200 ر.ق في الدوحة")
            : (siteSettings?.topBannerEn || "Free delivery on orders above 200 QAR in Doha")}{" "}
          🌶️
        </p>
      </div>

      {/* ─── MAIN NAVBAR ─────────────────────────── */}
      <nav className={`navbar transition-all duration-300 ${isScrolled ? "shadow-sm border-b border-stone-100" : ""}`}>
        <div className="container">
          <div className="navbar-inner">

            {/* ─── LOGO ─────────────────────────── */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <span className="text-white text-base">🌶️</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-base text-stone-900 tracking-tight">
                  {isArabic ? "الصادق" : "Al Sadek"}
                </span>
                <span className="text-[10px] text-amber-700 font-bold tracking-[0.12em] uppercase mt-0.5">
                  {isArabic ? "للبهارات" : "Spices"}
                </span>
              </div>
            </Link>

            {/* ─── DESKTOP NAV LINKS ─────────────────────────── */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all duration-150"
                >
                  {link.label}
                </Link>
              ))}
              {/* Track Order — distinct CTA */}
              <Link
                href="/track"
                className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all duration-150 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {isArabic ? "تتبع الطلب" : "Track Order"}
              </Link>
            </div>

            {/* ─── RIGHT ACTIONS ─────────────────────────── */}
            <div className="flex items-center gap-1">

              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all"
                aria-label="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Language */}
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-5 bg-stone-200 mx-1" />

              {/* Cart */}
              <Link
                id="nav-cart-icon"
                href="/cart"
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-150 ${
                  mounted && cartCount > 0
                    ? "text-amber-800 bg-amber-50 hover:bg-amber-100"
                    : "text-stone-600 hover:text-stone-800 hover:bg-stone-100"
                }${cartBounce ? " cart-icon-bounce" : ""}`}
                aria-label="Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {mounted && cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
                <span className="hidden sm:inline">{isArabic ? "السلة" : "Cart"}</span>
              </Link>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all ml-1"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ─── SEARCH BAR ─────────────────────────── */}
          {isSearchOpen && (
            <div className="pb-3 animate-fadeIn">
              <div className="search-bar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t.nav.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) window.location.href = `/shop?search=${searchQuery}`;
                    if (e.key === "Escape") setIsSearchOpen(false);
                  }}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-stone-400 hover:text-stone-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── MOBILE MENU ─────────────────────────── */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white animate-fadeIn">
            <div className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/track"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-2 mt-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {isArabic ? "تتبع الطلب" : "Track Order"}
              </Link>
              <div className="border-t border-stone-100 mt-2 pt-3 px-4">
                <LanguageToggle />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── MOBILE BOTTOM NAVIGATION ─────────────────────────── */}
      <div className="mobile-bottom-nav">
        <Link href="/" className="mobile-nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>{t.nav.home}</span>
        </Link>

        <Link href="/shop" className="mobile-nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>{t.nav.shop}</span>
        </Link>

        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="mobile-nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{isArabic ? "بحث" : "Search"}</span>
        </button>

        <Link href="/cart" className="mobile-nav-item relative">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {mounted && cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </div>
          <span>{t.nav.cart}</span>
        </Link>
      </div>
    </>
  );
}
