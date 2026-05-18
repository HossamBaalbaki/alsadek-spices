"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function FilterSidebar({
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  selectedLabels,
  setSelectedLabels,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  maxPrice = 500,
  onClose,
  isMobile = false,
}) {
  const { t, isArabic, getCategoryName } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [localPrice, setLocalPrice] = useState(priceRange || [0, maxPrice]);

  // ─── FETCH CATEGORIES FROM DB ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories?active=true");
        const data = await res.json();
        if (!cancelled && data?.success) {
          setCategories(Array.isArray(data.data) ? data.data : []);
        }
      } catch (err) {
        console.error("FilterSidebar: failed to load categories", err);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── SORT OPTIONS ───────────────────────────
  const sortOptions = [
    { value: "newest", label: t.general.newest },
    { value: "price-low-high", label: t.general.priceLowHigh },
    { value: "price-high-low", label: t.general.priceHighLow },
    { value: "best-selling", label: t.general.bestSelling },
  ];

  // ─── LABEL FILTERS ───────────────────────────
  const labelOptions = [
    { value: "isSale", label: t.labels.sale, color: "bg-red-500" },
    { value: "isNew", label: t.labels.new, color: "bg-green-500" },
    { value: "isHot", label: t.labels.hot, color: "bg-orange-500" },
    { value: "isLimited", label: t.labels.limited, color: "bg-blue-500" },
  ];

  // ─── HANDLE LABEL TOGGLE ───────────────────────────
  const handleLabelToggle = (value) => {
    if (selectedLabels.includes(value)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== value));
    } else {
      setSelectedLabels([...selectedLabels, value]);
    }
  };

  // ─── HANDLE PRICE CHANGE ───────────────────────────
  const handlePriceChange = (e) => {
    const value = Number(e.target.value);
    setLocalPrice([0, value]);
    setPriceRange([0, value]);
  };

  // ─── HANDLE RESET ───────────────────────────
  const handleReset = () => {
    setSelectedCategory("all");
    setSelectedType("all");
    setSelectedLabels([]);
    setPriceRange([0, maxPrice]);
    setLocalPrice([0, maxPrice]);
    setSortBy("newest");
  };

  // ─── CHECK IF ANY FILTER ACTIVE ───────────────────────────
  const hasActiveFilters =
    selectedCategory !== "all" ||
    (selectedType || "all") !== "all" ||
    selectedLabels.length > 0 ||
    priceRange[1] < maxPrice ||
    sortBy !== "newest";

  const wrapper = isMobile ? "flex flex-col h-full" : "bg-white rounded-2xl border border-stone-200 overflow-hidden";
  const inner   = isMobile ? "flex-1 overflow-y-auto" : "";
  const header  = isMobile ? "flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0" : "flex items-center justify-between p-4 border-b border-stone-100";
  const body    = isMobile ? "px-5 py-4 flex flex-col gap-6" : "p-4 flex flex-col gap-6";

  return (
    <div className={wrapper}>

      {/* ─── HEADER ─────────────────────────── */}
      <div className={header}>
        <div className="flex items-center gap-2">
          {/* Filter Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-amber-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h3 className="font-bold text-stone-800">
            {t.general.filter}
          </h3>

          {/* Active filter count badge */}
          {hasActiveFilters && (
            <span className="bg-amber-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {
                [
                  selectedCategory !== "all",
                  ...selectedLabels.map(() => true),
                  priceRange[1] < maxPrice,
                ].filter(Boolean).length
              }
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-amber-700 font-semibold hover:text-amber-900 transition-colors"
            >
              {isArabic ? "إعادة تعيين" : "Reset All"}
            </button>
          )}

          {/* Close button for mobile */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={`${inner} ${body}`}>

        {/* ─── SORT BY ─────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            {t.general.sortBy}
          </h4>
          <div className="flex flex-col gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all text-left ${
                  sortBy === option.value
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {/* Radio dot */}
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    sortBy === option.value
                      ? "border-amber-700"
                      : "border-stone-300"
                  }`}
                >
                  {sortBy === option.value && (
                    <div className="w-2 h-2 rounded-full bg-amber-700" />
                  )}
                </div>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── DIVIDER ─────────────────────────── */}
        <div className="divider" />

        {/* ─── CATEGORIES ─────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            {t.nav.categories}
          </h4>
          <div className="flex flex-col gap-1">
            {/* All Categories */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg transition-all text-left ${
                selectedCategory === "all"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span>
                {isArabic ? "جميع المنتجات" : "All Products"}
              </span>
              {selectedCategory === "all" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-amber-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Category List */}
            {categoriesLoading && (
              <div className="text-xs text-stone-400 px-3 py-2">
                {isArabic ? "جاري التحميل..." : "Loading..."}
              </div>
            )}
            {!categoriesLoading && categories.length === 0 && (
              <div className="text-xs text-stone-400 px-3 py-2">
                {isArabic ? "لا توجد فئات" : "No categories yet"}
              </div>
            )}
            {categories.map((category) => {
              const name =
                typeof getCategoryName === "function"
                  ? getCategoryName(category)
                  : isArabic
                  ? category.nameAr
                  : category.nameEn;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg transition-all text-left ${
                    selectedCategory === category.slug
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {category.icon && (
                      <span className="text-base">{category.icon}</span>
                    )}
                    {name}
                  </span>
                  <div className="flex items-center gap-2">
                    {typeof category.productCount === "number" && (
                      <span className="text-xs text-stone-400">
                        {category.productCount}
                      </span>
                    )}
                    {selectedCategory === category.slug && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-amber-700"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── DIVIDER ─────────────────────────── */}
        <div className="divider" />

        {/* ─── PRICE RANGE ─────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            {isArabic ? "نطاق السعر" : "Price Range"}
          </h4>

          {/* Price Display */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-stone-700">
              0 {t.general.qar}
            </span>
            <span className="text-sm font-semibold text-amber-700">
              {localPrice[1]} {t.general.qar}
            </span>
          </div>

          {/* Range Slider */}
          <input
            type="range"
            min="0"
            max={maxPrice}
            step="10"
            value={localPrice[1]}
            onChange={handlePriceChange}
            className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-700"
          />

          {/* Price Labels */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-stone-400">0</span>
            <span className="text-xs text-stone-400">{maxPrice} {t.general.qar}</span>
          </div>
        </div>

        {/* ─── DIVIDER ─────────────────────────── */}
        <div className="divider" />

        {/* ─── LABEL FILTERS ─────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            {isArabic ? "تصفية حسب" : "Filter By"}
          </h4>
          <div className="flex flex-wrap gap-2">
            {labelOptions.map((label) => (
              <button
                key={label.value}
                onClick={() => handleLabelToggle(label.value)}
                className={`filter-chip ${
                  selectedLabels.includes(label.value) ? "active" : ""
                }`}
              >
                {/* Color dot */}
                <span
                  className={`w-2 h-2 rounded-full ${label.color}`}
                />
                {label.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── DIVIDER ─────────────────────────── */}
        <div className="divider" />

        {/* ─── PRODUCT TYPE ─────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            {isArabic ? "نوع المنتج" : "Product Type"}
          </h4>
          <div className="flex flex-col gap-2">
            {[
              { value: "all",    label: isArabic ? "الكل"        : "All Types" },
              { value: "single", label: isArabic ? "منتج مفرد"   : "Single Product" },
              { value: "bundle", label: isArabic ? "باقة / عرض"  : "Bundle / Package" },
            ].map((type) => {
              const isActive = (selectedType || "all") === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all text-left ${
                    isActive
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isActive ? "border-amber-700" : "border-stone-300"}`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-amber-700" />}
                  </div>
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ─── APPLY BUTTON sticky at bottom (Mobile Only) ─────────────────────────── */}
      {isMobile && (
        <div className="flex-shrink-0 px-5 py-4 border-t border-stone-100 bg-white">
          <button
            onClick={onClose}
            className="btn btn-primary w-full py-3 text-base"
          >
            {isArabic ? "عرض النتائج" : "Show Results"}
          </button>
        </div>
      )}
    </div>
  );
}