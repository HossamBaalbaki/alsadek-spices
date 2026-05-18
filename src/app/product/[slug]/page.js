"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { isSoldOut } from "@/data/products";
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
  const { slug } = useParams();
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setPageLoading(true);
      setNotFound(false);
      setImageError(false);
      setActiveImage(0);
      try {
        const res = await fetch(`/api/products/${slug}`);
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
  }, [slug]);

  if (pageLoading) {
    return (
      <>
        <Navbar />
        <main className="page-content">
          <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <div className="skeleton aspect-square rounded-2xl" />
                <div className="flex gap-2">
                  {[0,1,2].map(i => <div key={i} className="skeleton w-16 h-16 rounded-lg" />)}
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-2">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-8 w-3/4 rounded" />
                <div className="skeleton h-5 w-32 rounded" />
                <div className="skeleton h-10 w-40 rounded" />
                <div className="skeleton h-px w-full rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
                <div className="skeleton h-4 w-4/6 rounded" />
                <div className="flex gap-2 mt-2">
                  {[0,1,2].map(i => <div key={i} className="skeleton h-11 w-20 rounded-lg" />)}
                </div>
                <div className="skeleton h-12 w-full rounded-xl mt-4" />
              </div>
            </div>
          </div>
        </main>
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

    const effectiveVariant = selectedVariant
      ? { ...selectedVariant, price: getVariantPriceNumber(selectedVariant) }
      : selectedVariant;

    const effectiveProduct =
      product.type === "bundle"
        ? { ...product, price: Number(finalPrice || product.price || 0) }
        : product;

    addToCart(effectiveProduct, effectiveVariant, quantity);
    setLoading(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;

  const stockUnits =
    product.type === "single" && selectedVariant?.grams > 0
      ? Math.floor(Number(product.stock?.currentStockGrams || 0) / selectedVariant.grams)
      : null;
  const isLowStock = stockUnits !== null && stockUnits > 0 && stockUnits < 10;

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
              <div
                className="relative aspect-square bg-stone-100 rounded-2xl overflow-hidden cursor-zoom-in"
                onClick={() => showImage && setLightboxOpen(true)}
              >
                <ProductBadges labels={safeLabels} isSoldOut={soldOut} position="card" />
                {showImage ? (
                  <Image
                    src={currentImage}
                    alt={productName}
                    fill
                    priority
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

              {isLowStock && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                  <span className="text-orange-500">🔥</span>
                  <p className="text-sm font-bold text-orange-700">
                    {isArabic
                      ? `متبقي ${stockUnits} فقط في المخزون!`
                      : `Only ${stockUnits} left in stock!`}
                  </p>
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

              <div className="flex flex-col gap-3">
                {soldOut ? (
                  <button disabled className="btn btn-disabled btn-lg">
                    {t.product.soldOut}
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={loading}
                    className={`btn btn-lg btn-full ${
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

                {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      isArabic ? `مرحباً، أريد طلب: ${productName}` : `Hello, I want to order: ${productName}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-[#25d366] hover:text-[#20b858] transition-colors py-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {isArabic ? "أو اطلب عبر واتساب" : "Or order via WhatsApp"}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  {
                    icon: "🌿",
                    textEn: "100% Natural",
                    textAr: "طبيعي 100%",
                    subEn: "No additives",
                    subAr: "بدون إضافات",
                  },
                  {
                    icon: "🚚",
                    textEn: "Fast Delivery",
                    textAr: "توصيل سريع",
                    subEn: "Same day in Doha",
                    subAr: "نفس اليوم بالدوحة",
                  },
                  {
                    icon: "💯",
                    textEn: "Guaranteed",
                    textAr: "مضمون",
                    subEn: "Quality assured",
                    subAr: "جودة مضمونة",
                  },
                ].map((badge, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center p-3 bg-stone-50 rounded-xl border border-stone-100"
                  >
                    <span className="text-2xl mb-1">{badge.icon}</span>
                    <span className="text-xs font-bold text-stone-800">
                      {isArabic ? badge.textAr : badge.textEn}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      {isArabic ? badge.subAr : badge.subEn}
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

      {/* ─── IMAGE LIGHTBOX ─────────────────────────── */}
      {lightboxOpen && showImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative w-full max-w-2xl aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage}
              alt={productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {safeImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {safeImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(idx); setImageError(false); }}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${activeImage === idx ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
