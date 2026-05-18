"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/shop/ProductCard";
import FilterSidebar from "@/components/shop/FilterSidebar";

function ShopPage() {
  const { t, isArabic } = useLanguage();
  const searchParams = useSearchParams();

  // ─── STATE ───────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);

  // ─── FILTERS ───────────────────────────
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [maxPrice, setMaxPrice] = useState(500);

  const applyClientFilters = useCallback((items) => {
    let filtered = items;
    if (selectedType !== "all") {
      filtered = filtered.filter((p) => p.type === selectedType);
    }
    if (selectedLabels.length > 0) {
      filtered = filtered.filter((p) => {
        const labels = p.labels || {};
        return selectedLabels.some((l) => labels[l] === true);
      });
    }
    filtered = filtered.filter((p) => {
      const price = p.type === "bundle" ? p.price : p.variants?.[0]?.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    return filtered;
  }, [selectedType, selectedLabels, priceRange]);

  const buildParams = useCallback((pg) => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    if (sortBy) params.set("sort", sortBy);
    params.set("page", String(pg));
    params.set("limit", "12");
    return params;
  }, [selectedCategory, searchQuery, sortBy]);

  // ─── FETCH PAGE 1 (replaces list) ───────────────────────────
  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      // Silent poll: re-fetch all currently loaded pages to keep the list fresh
      // without discarding products the user loaded via "Load More"
      if (silent && pageRef.current > 1) {
        const pageNums = Array.from({ length: pageRef.current }, (_, i) => i + 1);
        const results = await Promise.all(
          pageNums.map((pg) => fetch(`/api/products?${buildParams(pg)}`).then((r) => r.json()))
        );
        const allProducts = results.flatMap((d) => d.success ? applyClientFilters(d.data) : []);
        // Only update state if stock levels actually changed — prevents scroll stutter
        setProducts((prev) => {
          const changed = allProducts.some((p, i) =>
            !prev[i] || prev[i].id !== p.id || prev[i].currentStockPcs !== p.currentStockPcs
          );
          return changed ? allProducts : prev;
        });
        return;
      }

      const res = await fetch(`/api/products?${buildParams(1)}`);
      const data = await res.json();
      if (data.success) {
        const filtered = applyClientFilters(data.data);
        setProducts(filtered);
        setTotalProducts(data.pagination.total);
        setHasMore(data.data.length === 12);
        pageRef.current = 1;
        setPage(1);
      } else {
        if (!silent) setError("Failed to load products");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (!silent) setError("Failed to load products");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [buildParams, applyClientFilters]);

  // ─── LOAD MORE (appends next page) ───────────────────────────
  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/products?${buildParams(nextPage)}`);
      const data = await res.json();
      if (data.success) {
        const filtered = applyClientFilters(data.data);
        setProducts((prev) => [...prev, ...filtered]);
        pageRef.current = nextPage;
        setPage(nextPage);
        setHasMore(data.data.length === 12);
      }
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ─── FETCH ON FILTER CHANGE ───────────────────────────
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ─── FETCH MAX PRICE ONCE ───────────────────────────
  useEffect(() => {
    fetch("/api/products/price-range")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.maxPrice > 0) setMaxPrice(d.maxPrice); })
      .catch(() => {});
  }, []);

  usePolling(() => fetchProducts(true), 30000);

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
                className={`input w-full ${isArabic ? "pr-10" : "pl-10"} bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white focus:text-stone-800 focus:placeholder-stone-400`}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 absolute ${isArabic ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-white/50`}
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
                  maxPrice={maxPrice}
                  isMobile={false}
                />
              </div>
            </aside>

            {/* ─── MAIN CONTENT ─────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* ─── MOBILE FILTER BUTTON ─────────────────────────── */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <p className="text-sm text-stone-500">
                  {totalProducts} {isArabic ? "منتج" : "products"}
                </p>
                <button
                  onClick={() => setShowMobileFilter(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    selectedCategory !== "all" || selectedLabels.length > 0 || priceRange[1] < 500 || selectedType !== "all"
                      ? "bg-amber-700 text-white border-amber-700"
                      : "bg-white text-stone-700 border-stone-200"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  {isArabic ? "الفلاتر" : "Filters"}
                  {(selectedCategory !== "all" || selectedLabels.length > 0 || priceRange[1] < 500 || selectedType !== "all") && (
                    <span className="bg-white/30 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {[selectedCategory !== "all", selectedType !== "all", ...selectedLabels.map(() => true), priceRange[1] < 500].filter(Boolean).length}
                    </span>
                  )}
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
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i < 4} />
                  ))}
                </div>
              )}

              {/* ─── LOAD MORE ─────────────────────────── */}
              {!loading && !error && hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn btn-outline px-8"
                  >
                    {loadingMore
                      ? (isArabic ? "جارٍ التحميل…" : "Loading…")
                      : (isArabic ? "تحميل المزيد" : "Load More")}
                  </button>
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
                      setPriceRange([0, maxPrice]);
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

        {/* ─── MOBILE FILTER BOTTOM SHEET ─────────────────────────── */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileFilter(false)}
            />
            {/* Sheet */}
            <div className="relative bg-white rounded-t-3xl flex flex-col"
              style={{ maxHeight: "90dvh" }}>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-stone-300" />
              </div>
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
                maxPrice={maxPrice}
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

export default function ShopPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ShopPage />
    </Suspense>
  );
}