"use client";

import { useState, useEffect, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/shop/ProductCard";
import FilterSidebar from "@/components/shop/FilterSidebar";

export default function ShopPage() {
  const { t, isArabic } = useLanguage();

  // ─── STATE ───────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);

  // ─── FILTERS ───────────────────────────
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [page, setPage] = useState(1);

  // ─── READ INITIAL CATEGORY FROM URL ───────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);
  }, []);

  // ─── FETCH PRODUCTS ───────────────────────────
  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);

    try {
      const params = new URLSearchParams();

      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (sortBy) {
        params.set("sort", sortBy);
      }

      params.set("page", page.toString());
      params.set("limit", "12");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        let filtered = data.data;

        // ─── CLIENT SIDE TYPE FILTER ───────────────────────────
        if (selectedType !== "all") {
          filtered = filtered.filter((p) => p.type === selectedType);
        }

        // ─── CLIENT SIDE LABEL FILTER ───────────────────────────
        if (selectedLabels.length > 0) {
          filtered = filtered.filter((product) => {
            const labels = product.labels || {};
            return selectedLabels.some((label) => labels[label] === true);
          });
        }

        // ─── CLIENT SIDE PRICE FILTER ───────────────────────────
        filtered = filtered.filter((product) => {
          const price = product.type === "bundle"
            ? product.price
            : product.variants?.[0]?.price || 0;
          return price >= priceRange[0] && price <= priceRange[1];
        });

        setProducts(filtered);
        setTotalProducts(data.pagination.total);
      } else {
        if (!silent) setError("Failed to load products");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (!silent) setError("Failed to load products");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedCategory, selectedType, searchQuery, sortBy, page, selectedLabels, priceRange]);

  // ─── FETCH ON FILTER CHANGE ───────────────────────────
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  usePolling(() => fetchProducts(true), 30000);

  // ─── RESET PAGE ON FILTER CHANGE ───────────────────────────
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedType, searchQuery, sortBy, selectedLabels, priceRange]);

  return (
    <>
      <Navbar />
      <main className="page-content">

        {/* ─── PAGE HEADER ─────────────────────────── */}
        <div className="bg-stone-900 py-8">
          <div className="container">
            <h1 className="text-2xl font-black text-white mb-4">
              {isArabic ? "المتجر" : "Shop"}
              {totalProducts > 0 && (
                <span className="text-amber-400 ml-2 text-lg font-semibold">
                  ({totalProducts} {isArabic ? "منتج" : "products"})
                </span>
              )}
            </h1>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? "ابحث عن منتج..." : "Search products..."}
                className="input w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white focus:text-stone-800 focus:placeholder-stone-400"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="flex gap-8">

            {/* ─── DESKTOP FILTER SIDEBAR ─────────────────────────── */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white rounded-2xl border border-stone-200 p-5">
                <FilterSidebar
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  selectedLabels={selectedLabels}
                  setSelectedLabels={setSelectedLabels}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  isMobile={false}
                />
              </div>
            </aside>

            {/* ─── MAIN CONTENT ─────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* ─── MOBILE FILTER BUTTON ─────────────────────────── */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <p className="text-sm text-stone-500">
                  {products.length} {isArabic ? "منتج" : "products"}
                </p>
                <button
                  onClick={() => setShowMobileFilter(true)}
                  className="btn btn-outline btn-sm flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                    />
                  </svg>
                  {isArabic ? "الفلاتر" : "Filters"}
                </button>
              </div>

              {/* ─── ERROR ─────────────────────────── */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                  <p className="text-red-600 font-semibold">{error}</p>
                  <button
                    onClick={fetchProducts}
                    className="btn btn-sm btn-outline mt-2"
                  >
                    {isArabic ? "إعادة المحاولة" : "Try Again"}
                  </button>
                </div>
              )}

              {/* ─── LOADING ─────────────────────────── */}
              {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse"
                    >
                      <div className="h-48 bg-stone-200" />
                      <div className="p-4">
                        <div className="h-4 bg-stone-200 rounded mb-2" />
                        <div className="h-4 bg-stone-200 rounded w-2/3 mb-4" />
                        <div className="h-8 bg-stone-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── PRODUCTS GRID ─────────────────────────── */}
              {!loading && !error && products.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* ─── EMPTY STATE ─────────────────────────── */}
              {!loading && !error && products.length === 0 && (
                <div className="empty-state py-20">
                  <div className="text-6xl">🔍</div>
                  <div>
                    <h3 className="text-xl font-black text-stone-800 mb-2">
                      {isArabic ? "لا توجد منتجات" : "No Products Found"}
                    </h3>
                    <p className="text-stone-400">
                      {isArabic
                        ? "جرب تغيير الفلاتر"
                        : "Try changing the filters"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedType("all");
                      setSelectedLabels([]);
                      setPriceRange([0, 500]);
                      setSearchQuery("");
                    }}
                    className="btn btn-primary"
                  >
                    {isArabic ? "مسح الفلاتر" : "Clear Filters"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── MOBILE FILTER DRAWER ─────────────────────────── */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileFilter(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-5">
              <FilterSidebar
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedLabels={selectedLabels}
                setSelectedLabels={setSelectedLabels}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onClose={() => setShowMobileFilter(false)}
                isMobile={true}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}