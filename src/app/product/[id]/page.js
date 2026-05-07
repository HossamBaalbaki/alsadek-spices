"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { isSoldOut } from "@/data/products";
import { parseWeightLabelToGrams } from "@/lib/stock";
import { ProductBadges, SavingsBadge } from "@/components/ui/Badge";
import { QuantitySelector } from "@/components/ui/Button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/shop/ProductGrid";

const getVariantLabel = (variant) =>
  variant?.weightLabel || variant?.weight || `${variant?.grams || 0}g`;

const getVariantPriceNumber = (variant) => {
  const n = Number(variant?.price);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function ProductPage() {
  const { id } = useParams();
  const { t, isArabic } = useLanguage();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setPageLoading(true);
      setNotFound(false);
      setImageError(false);
      setActiveImage(0);
      try {
        const res = await fetch(`/api/products/id/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.data) {
          setNotFound(true);
          setProduct(null);
          setRelatedProducts([]);
          return;
        }
        const fetched = data.data;
        setProduct(fetched);
        setRelatedProducts(fetched.related || []);
        setSelectedVariant(
          fetched?.type === "single" ? fetched?.variants?.[0] || null : null
        );
      } catch (error) {
        console.error("Product page fetch error:", error);
        setNotFound(true);
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setPageLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (pageLoading) {
    return (
      <>
        <Navbar />
        <div className="container py-20 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            {isArabic ? "جاري تحميل المنتج..." : "Loading product..."}
          </h1>
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <Navbar />
        <div className="container py-20 text-center">
          <div className="text-6xl mb-4">🌶️</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            {isArabic ? "المنتج غير موجود" : "Product Not Found"}
          </h1>
          <p className="text-stone-500 mb-6">
            {isArabic
              ? "المنتج الذي تبحث عنه غير متوفر"
              : "The product you are looking for does not exist"}
          </p>
          <Link href="/shop" className="btn btn-primary btn-lg">
            {isArabic ? "العودة للمتجر" : "Back to Shop"}
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const safeLabels = product.labels || {
    isNew: false, isHot: false, isSale: false, salePercent: 0, isLimited: false,
  };
  const safeVariants = Array.isArray(product.variants) ? product.variants : [];
  const safeImages = Array.isArray(product.images) ? product.images : [];
  const productForSoldOut = { ...product, variants: safeVariants };
  const soldOut = isSoldOut(productForSoldOut);

  const productName = isArabic
    ? product.nameAr || product.nameEn || ""
    : product.nameEn || product.nameAr || "";
  const productDescription = isArabic
    ? product.descriptionAr || product.descriptionEn || ""
    : product.descriptionEn || product.descriptionAr || "";
  const category = product.category || null;
  const categorySlug = category?.slug || product.categorySlug || "";

  const getPrice = () => {
    if (product.type === "bundle") {
      const bundlePrice = Number(product.price);
      return Number.isFinite(bundlePrice) ? bundlePrice : 0;
    }

    const refVariant = selectedVariant || safeVariants[0] || null;
    if (refVariant) {
      return getVariantPriceNumber(refVariant);
    }

    return Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
  };

  const price = getPrice();
  // Single: variant.price is already discounted by the API (enrichSingleVariants).
  // Bundle: product.price is the base price, discount applied here.
  const finalPrice = safeLabels.isSale && product.type === "bundle"
    ? Number(product.price || 0) * (1 - Number(safeLabels.salePercent || 0) / 100)
    : price;

  const originalPrice =
    product.type === "bundle"
      ? Number.isFinite(Number(product.originalPrice))
        ? Number(product.originalPrice)
        : safeLabels.isSale && safeLabels.salePercent
          ? Number(product.price || 0)
          : null
      : safeLabels.isSale
      ? (() => {
          const refVariant = selectedVariant || safeVariants[0] || null;
          const orig = Number(refVariant?.originalPrice);
          return Number.isFinite(orig) && orig > 0 ? orig : null;
        })()
      : null;

  const currentImage = safeImages[activeImage]?.trim();
  const showImage = !imageError && currentImage;

  const handleAddToCart = () => {
    if (soldOut) return;
    setLoading(true);
    setTimeout(() => {
      // variant.price is already the sale-discounted price — use it directly
      const effectiveVariant = selectedVariant
        ? { ...selectedVariant, price: getVariantPriceNumber(selectedVariant) }
        : selectedVariant;

      const effectiveProduct =
        product.type === "bundle"
          ? {
              ...product,
              price: Number(finalPrice || product.price || 0),
            }
          : product;

      addToCart(effectiveProduct, effectiveVariant, quantity);
      setLoading(false);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }, 500);
  };

  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;

  return (
    <>
      <Navbar />
      <main className="page-content">
        <div className="bg-stone-50 border-b border-stone-200">
          <div className="container py-3">
            <div className="breadcrumb">
              <div className="breadcrumb-item">
                <Link href="/" className="hover:text-amber-700">{t.nav.home}</Link>
              </div>
              <span className="breadcrumb-separator">›</span>
              <div className="breadcrumb-item">
                <Link href="/shop" className="hover:text-amber-700">{t.nav.shop}</Link>
              </div>
              <span className="breadcrumb-separator">›</span>
              <div className="breadcrumb-item">
                <span className="text-stone-800 font-medium">{productName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square bg-stone-100 rounded-2xl overflow-hidden">
                <ProductBadges labels={safeLabels} isSoldOut={soldOut} position="card" />
                {showImage ? (
                  <Image
                    src={currentImage}
                    alt={productName}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
                    <span className="text-8xl mb-4">🌶️</span>
                    <span className="text-stone-500 font-medium">{productName}</span>
                  </div>
                )}
                {soldOut && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="bg-stone-600 text-white px-6 py-3 rounded-full font-bold text-lg rotate-[-15deg] shadow-lg">
                      {t.labels.soldOut}
                    </div>
                  </div>
                )}
              </div>

              {safeImages.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {safeImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setActiveImage(idx); setImageError(false); }}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        activeImage === idx ? "border-amber-500" : "border-stone-200"
                      }`}
                    >
                      {img?.trim() ? (
                        <Image src={img} alt={`${productName} ${idx + 1}`} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🌶️</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              {category && (
                <Link
                  href={`/shop?category=${categorySlug}`}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-900 w-fit"
                >
                  {isArabic ? category.nameAr : category.nameEn}
                </Link>
              )}

              <h1 className="text-3xl font-black text-stone-900">{productName}</h1>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${star <= Math.round(rating) ? "text-amber-400" : "text-stone-200"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-bold text-stone-700">{rating}</span>
                <span className="text-stone-400 text-sm">
                  ({reviewCount} {t.product.reviews})
                </span>
              </div>

              <div className="divider" />

              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-stone-900">
                  {Number(finalPrice).toFixed(2)}
                  <span className="text-lg font-semibold text-stone-500 ml-1">{t.general.qar}</span>
                </span>
                {originalPrice && originalPrice !== finalPrice && (
                  <span className="text-xl text-stone-400 line-through mb-1">
                    {Number(originalPrice).toFixed(2)} {t.general.qar}
                  </span>
                )}
              </div>

              {product.type === "bundle" && product.originalPrice && (
                <SavingsBadge originalPrice={Number(product.originalPrice)} currentPrice={Number(product.price || 0)} />
              )}

              <div className="divider" />

              {product.type === "single" && safeVariants.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-stone-700 mb-3">{t.product.selectWeight}</p>
                  <div className="weight-options">
                    {safeVariants.map((variant, index) => {
                      const vLabel = getVariantLabel(variant);
                      const isSelected =
                        getVariantLabel(selectedVariant) === vLabel;
                      const vPrice = getVariantPriceNumber(variant);
                      return (
                        <button
                          key={`${vLabel}-${index}`}
                          onClick={() => setSelectedVariant(variant)}
                          className={`weight-option ${isSelected ? "selected" : ""} ${
                            Number(variant?.available) === 0 ||
                            variant?.available === false ||
                            Number(variant?.stock) === 0
                              ? "out-of-stock"
                              : ""
                          }`}
                        >
                          {vLabel}
                          <span className="block text-xs mt-0.5">
                            {Number(vPrice).toFixed(2)} {t.general.qar}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.type === "bundle" && Array.isArray(product.bundleItems) && (
                <div>
                  <p className="text-sm font-bold text-stone-700 mb-3">{t.product.whatsInside}</p>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    {product.bundleItems.map((item, index) => (
                      <div key={index} className="bundle-item">
                        <div className="bundle-item-dot" />
                        <span className="text-stone-700">
                          {isArabic ? item.nameAr : item.nameEn}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!soldOut && (
                <div>
                  <p className="text-sm font-bold text-stone-700 mb-3">
                    {isArabic ? "الكمية" : "Quantity"}
                  </p>
                  <QuantitySelector
                    quantity={quantity}
                    onIncrease={() => setQuantity(quantity + 1)}
                    onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                    min={1}
                    max={99}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {soldOut ? (
                  <button disabled className="btn btn-disabled btn-lg flex-1">
                    {t.product.soldOut}
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={loading}
                    className={`btn btn-lg flex-1 ${
                      addedToCart ? "bg-green-600 border-green-600 text-white" : "btn-primary"
                    }`}
                  >
                    {loading
                      ? (isArabic ? "جاري الإضافة..." : "Adding...")
                      : addedToCart
                      ? `✅ ${isArabic ? "تمت الإضافة!" : "Added!"}`
                      : t.product.addToCart}
                  </button>
                )}

                <a
                  href={`https://wa.me/97400000000?text=${encodeURIComponent(
                    isArabic ? `مرحباً، أريد طلب: ${productName}` : `Hello, I want to order: ${productName}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-lg bg-[#25d366] border-[#25d366] text-white hover:bg-[#20b858]"
                >
                  WhatsApp
                </a>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: "🌿", textEn: "100% Natural", textAr: "طبيعي 100%" },
                  { icon: "🚚", textEn: "Fast Delivery", textAr: "توصيل سريع" },
                  { icon: "💯", textEn: "Guaranteed", textAr: "مضمون" },
                ].map((badge, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center p-3 bg-stone-50 rounded-xl border border-stone-100"
                  >
                    <span className="text-xl mb-1">{badge.icon}</span>
                    <span className="text-xs font-semibold text-stone-600">
                      {isArabic ? badge.textAr : badge.textEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black text-stone-900 mb-4">{t.product.description}</h2>
            <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                {productDescription ||
                  (isArabic
                    ? "لا يوجد وصف لهذا المنتج."
                    : "No description available for this product.")}
              </p>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <div className="section-header">
                <div className="section-header-left">
                  <h2 className="section-title">{t.product.relatedProducts}</h2>
                </div>
                <Link
                  href={`/shop?category=${categorySlug}`}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-900"
                >
                  {t.general.viewAll}
                </Link>
              </div>
              <ProductGrid products={relatedProducts} loading={false} columns="default" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
