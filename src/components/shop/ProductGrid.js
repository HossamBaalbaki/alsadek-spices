"use client";

import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/shop/ProductCard";

// ─── SKELETON CARD (Loading State) ───────────────────────────
function SkeletonCard() {
  return (
    <div className="product-card">
      {/* Image Skeleton */}
      <div className="aspect-square skeleton rounded-t-lg" />

      {/* Content Skeleton */}
      <div className="p-3 flex flex-col gap-3">
        {/* Name */}
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />

        {/* Stars */}
        <div className="skeleton h-3 w-24 rounded" />

        {/* Variants */}
        <div className="flex gap-2">
          <div className="skeleton h-7 w-12 rounded-md" />
          <div className="skeleton h-7 w-12 rounded-md" />
          <div className="skeleton h-7 w-12 rounded-md" />
        </div>

        {/* Price */}
        <div className="skeleton h-5 w-20 rounded" />

        {/* Button */}
        <div className="skeleton h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─── EMPTY STATE ───────────────────────────
function EmptyState() {
  const { t } = useLanguage();

  return (
    <div className="empty-state col-span-full">
      {/* Icon */}
      <div className="empty-state-icon">🌶️</div>

      {/* Text */}
      <div className="text-center">
        <h3 className="font-bold text-stone-700 text-lg mb-1">
          {t.general.noProducts}
        </h3>
        <p className="text-stone-400 text-sm">
          {t.general.noProductsSubtitle}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PRODUCT GRID ───────────────────────────
export default function ProductGrid({
  products = [],
  loading = false,
  skeletonCount = 8,
  columns = "default",
}) {
  const { t } = useLanguage();

  // ─── COLUMN STYLES ───────────────────────────
  const columnStyles = {
    // Default — 2 on mobile, 3 on tablet, 4 on desktop
    default: "products-grid",

    // 2 columns always
    two: "grid grid-cols-2 gap-4",

    // 3 columns
    three: "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6",

    // Featured — larger cards
    featured: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  };

  const gridClass = columnStyles[columns] || columnStyles.default;

  // ─── LOADING STATE ───────────────────────────
  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // ─── EMPTY STATE ───────────────────────────
  if (!products || products.length === 0) {
    return (
      <div className={gridClass}>
        <EmptyState />
      </div>
    );
  }

  // ─── PRODUCTS GRID ───────────────────────────
  return (
    <div className={gridClass}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-fadeIn"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}