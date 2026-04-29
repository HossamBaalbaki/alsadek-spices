"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/data/translations";

// ─── CREATE CONTEXT ───────────────────────────
const LanguageContext = createContext();

// ─── PROVIDER COMPONENT ───────────────────────────
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");
  const [dir, setDir] = useState("ltr");

  // Load saved language from browser on first visit
  useEffect(() => {
    const savedLang = localStorage.getItem("alsadek-lang");
    if (savedLang) {
      setLang(savedLang);
      setDir(savedLang === "ar" ? "rtl" : "ltr");
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = savedLang;
    }
  }, []);

  // ─── TOGGLE LANGUAGE ───────────────────────────
  const toggleLanguage = () => {
    const newLang = lang === "en" ? "ar" : "en";
    const newDir = newLang === "ar" ? "rtl" : "ltr";

    setLang(newLang);
    setDir(newDir);

    // Save to browser
    localStorage.setItem("alsadek-lang", newLang);

    // Update HTML direction and language
    document.documentElement.dir = newDir;
    document.documentElement.lang = newLang;
  };

  // ─── GET TRANSLATION ───────────────────────────
  const t = translations[lang];

  // ─── GET PRODUCT NAME ───────────────────────────
  // Helper to get product name in current language
  const getName = (product) => {
    return lang === "ar" ? product.nameAr : product.nameEn;
  };

  // ─── GET PRODUCT DESCRIPTION ───────────────────────────
  const getDescription = (product) => {
    return lang === "ar" ? product.descriptionAr : product.descriptionEn;
  };

  // ─── GET CATEGORY NAME ───────────────────────────
  const getCategoryName = (category) => {
    return lang === "ar" ? category.nameAr : category.nameEn;
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir,
        t,
        toggleLanguage,
        getName,
        getDescription,
        getCategoryName,
        isArabic: lang === "ar",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ─── CUSTOM HOOK ───────────────────────────
// Use this in any component like:
// const { lang, t, toggleLanguage } = useLanguage();
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}