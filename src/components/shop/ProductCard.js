"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { ProductBadges, SoldOutOverlay } from "@/components/ui/Badge";
import { AddToCartButton, NotifyMeButton } from "@/components/ui/Button";
import { isSoldOut } from "@/data/products";

const getVariantLabel = (variant) =>
  variant?.weightLabel || variant?.weight || `${variant?.grams || 0}g`;

const getVariantPrice = (variant) => {
  const n = Number(variant?.price);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const getBundleItemsText = (item, isArabic) => {
  if (!item) return "";
  const direct = isArabic ? item.nameAr : item.nameEn;
  if (typeof direct === "string" && direct.trim()) return direct;

  // New schema bundle item may contain stock object instead of direct name fields
  const stock = item.stock;
  if (stock && typeof stock === "object") {
    const stockName = isArabic ? stock.nameAr : stock.nameEn;
    if (typeof stockName === "string" && stockName.trim()) return stockName;
  }

  return "Item";
};

export default function ProductCard({ product, rank, priority = false }) {
  const { t, getName, isArabic } = useLanguage();
  const { addToCart, triggerFly } = useCart();

  const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
  const safeBundleItems = Array.isArray(product?.bundleItems) ? product.bundleItems : [];
  const safeLabels = product?.labels || {
    isNew: false, isHot: false, isSale: false, salePercent: 0, isLimited: false,
  };

  const [selectedVariant, setSelectedVariant] = useState(
    product?.type === "single" ? safeVariants[0] || null : null
  );
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const soldOut = isSoldOut({ ...product, variants: safeVariants });

  const getPrice = () => {
    if (product?.type === "bundle") {
      const p = Number(product?.price);
      return Number.isFinite(p) ? p : 0;
    }
    const refVariant = selectedVariant || safeVariants[0] || null;
    if (refVariant) return getVariantPrice(refVariant);
    const p = Number(product?.price);
    return Number.isFinite(p) ? p : 0;
  };

  const getOriginalPrice = () => {
    if (!safeLabels.isSale || !safeLabels.salePercent) return null;

    if (product?.type === "bundle") {
      const explicitOriginal = Number(product?.originalPrice);
      if (Number.isFinite(explicitOriginal) && explicitOriginal > 0) {
        return explicitOriginal;
      }
      // Reverse-calculate original from discounted bundle price
      const current = Number(product?.price);
      const pct = Number(safeLabels.salePercent) / 100;
      if (Number.isFinite(current) && current > 0 && pct > 0 && pct < 1) {
        return current / (1 - pct);
      }
      return null;
    }

    // Single: API already discounts variant.price and puts the base in originalPrice
    const refVariant = selectedVariant || safeVariants[0] || null;
    const orig = Number(refVariant?.originalPrice);
    return Number.isFinite(orig) && orig > 0 ? orig : null;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (soldOut) return;

    triggerFly(e.currentTarget.getBoundingClientRect());
    setLoading(true);

    const effectiveVariant = selectedVariant
      ? {
          ...selectedVariant,
          price: Number(selectedVariant?.price ?? getVariantPrice(selectedVariant) ?? 0),
        }
      : selectedVariant;

    const effectiveProduct =
      product?.type === "bundle"
        ? { ...product, price: Number(displayPrice || product?.price || 0) }
        : product;

    addToCart(effectiveProduct, effectiveVariant, 1);
    setLoading(false);
  };

  const handleVariantSelect = (e, variant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(variant);
  };

  const price = getPrice();
  const originalPrice = getOriginalPrice();
  // For single products, variant.price is already the sale-discounted price (set by enrichSingleVariants).
  // For bundles, product.price is the base price and the discount needs applying here.
  const displayPrice =
    safeLabels.isSale && safeLabels.salePercent && product?.type === "bundle"
      ? Number(product?.price || 0) * (1 - Number(safeLabels.salePercent) / 100)
      : price;
  const productName = getName(product);
  const imageSrc = product?.images?.[0]?.trim();

  return (
    <Link href={`/product/${product?.slug}`}>
      <div className={`product-card h-full flex flex-col ${soldOut ? "sold-out" : ""}`}>
        <div className="relative aspect-square bg-stone-100 rounded-t-lg overflow-hidden">
          {rank && (
            <div className="absolute top-2 left-2 z-20 w-7 h-7 bg-amber-700 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">
              #{rank}
            </div>
          )}
          <ProductBadges labels={safeLabels} isSoldOut={soldOut} position="card" />
          {soldOut && <SoldOutOverlay />}

          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={productName}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
              <span className="text-5xl mb-2">🌶️</span>
              <span className="text-xs text-stone-400 font-medium text-center px-2">
                {productName}
              </span>
            </div>
          )}

          {product?.type === "bundle" && (
            <div className="absolute bottom-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              📦 {t.labels.bundle}
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1 gap-2">
          <h3 className="font-semibold text-stone-800 text-sm leading-tight line-clamp-2">
            {productName}
          </h3>

          <div className="flex items-center gap-1">
            <div className="stars flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3 w-3 ${
                    star <= Math.round(product?.rating || 0)
                      ? "text-amber-400"
                      : "text-stone-200"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-stone-400">
              ({product?.reviewCount || 0})
            </span>
          </div>

          {product?.type === "single" && safeVariants.length > 0 && (
            <div className="weight-options">
              {safeVariants.map((variant, index) => {
                const label = getVariantLabel(variant);
                const key = `${product?.id}-${label}-${index}`;
                const selectedLabel = getVariantLabel(selectedVariant);
                const isSelected = selectedLabel === label;

                return (
                  <button
                    key={key}
                    onClick={(e) => handleVariantSelect(e, variant)}
                    className={`weight-option ${isSelected ? "selected" : ""} ${
                      Number(variant?.available) === 0 ||
                      variant?.available === false ||
                      Number(variant?.stock) === 0
                        ? "out-of-stock"
                        : ""
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {product?.type === "bundle" && safeBundleItems.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {safeBundleItems.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200"
                >
                  {getBundleItemsText(item, isArabic)}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-auto">
            <span className={`font-bold text-base ${safeLabels.isSale ? "price-discounted" : "text-stone-800"}`}>
              {Number(displayPrice || 0).toFixed(2)}{" "}
              <span className="text-xs font-semibold opacity-70">
                {t.general.qar}
              </span>
            </span>

            {originalPrice ? (
              <span className="price-original text-xs">
                {Number(originalPrice).toFixed(2)} {t.general.qar}
              </span>
            ) : null}
          </div>

          <div onClick={(e) => e.preventDefault()}>
            {soldOut ? (
              <NotifyMeButton onClick={(e) => e.preventDefault()} />
            ) : (
              <AddToCartButton
                isSoldOut={false}
                onClick={handleAddToCart}
                loading={loading}
                fullWidth={true}
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
