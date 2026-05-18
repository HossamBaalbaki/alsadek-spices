export const products = [
  // ─── SINGLE PRODUCTS ───────────────────────────
  {
    id: 1,
    slug: "cardamom-green",
    nameEn: "Green Cardamom",
    nameAr: "هيل أخضر",
    categoryId: 1,
    categorySlug: "arabic-spices",
    type: "single",
    descriptionEn:
      "Premium quality green cardamom sourced from the finest farms. Perfect for Arabic coffee, desserts, and rice dishes.",
    descriptionAr:
      "هيل أخضر فاخر من أجود المزارع. مثالي للقهوة العربية والحلويات وأطباق الأرز.",
    images: ["/images/products/cardamom.jpg"],
    variants: [
      { weight: "100g", price: 15, stock: 50 },
      { weight: "250g", price: 32, stock: 30 },
      { weight: "500g", price: 58, stock: 20 },
    ],
    labels: {
      isNew: true,
      isHot: false,
      isSale: false,
      salePercent: 0,
      isLimited: false,
    },
    rating: 4.8,
    reviewCount: 124,
    active: true,
    featured: true,
    bestSeller: true,
  },
  {
    id: 2,
    slug: "saffron-premium",
    nameEn: "Premium Saffron",
    nameAr: "زعفران فاخر",
    categoryId: 1,
    categorySlug: "arabic-spices",
    type: "single",
    descriptionEn:
      "Pure premium saffron threads with intense color and aroma. The finest quality available in Qatar.",
    descriptionAr:
      "خيوط زعفران فاخرة نقية بلون وعطر مكثف. أجود جودة متاحة في قطر.",
    images: ["/images/products/saffron.jpg"],
    variants: [
      { weight: "1g", price: 45, stock: 100 },
      { weight: "2g", price: 85, stock: 60 },
      { weight: "5g", price: 200, stock: 25 },
    ],
    labels: {
      isNew: false,
      isHot: true,
      isSale: false,
      salePercent: 0,
      isLimited: false,
    },
    rating: 4.9,
    reviewCount: 89,
    active: true,
    featured: true,
    bestSeller: true,
  },
  {
    id: 3,
    slug: "turmeric-powder",
    nameEn: "Turmeric Powder",
    nameAr: "مسحوق الكركم",
    categoryId: 2,
    categorySlug: "indian-spices",
    type: "single",
    descriptionEn:
      "High curcumin content turmeric powder. Vibrant golden color perfect for curries and health drinks.",
    descriptionAr:
      "مسحوق كركم بمحتوى عالٍ من الكركمين. لون ذهبي نابض مثالي للكاري والمشروبات الصحية.",
    images: ["/images/products/turmeric.jpg"],
    variants: [
      { weight: "250g", price: 12, stock: 80 },
      { weight: "500g", price: 20, stock: 45 },
      { weight: "1kg", price: 35, stock: 20 },
    ],
    labels: {
      isNew: false,
      isHot: false,
      isSale: true,
      salePercent: 20,
      isLimited: false,
    },
    rating: 4.6,
    reviewCount: 67,
    active: true,
    featured: true,
    bestSeller: false,
  },
  {
    id: 4,
    slug: "black-pepper",
    nameEn: "Black Pepper",
    nameAr: "فلفل أسود",
    categoryId: 4,
    categorySlug: "salt-pepper",
    type: "single",
    descriptionEn:
      "Whole black peppercorns with intense flavor. Freshly ground for maximum aroma.",
    descriptionAr:
      "حبوب فلفل أسود كاملة بنكهة مكثفة. مطحونة طازجة لأقصى عطر.",
    images: ["/images/products/black-pepper.jpg"],
    variants: [
      { weight: "100g", price: 8, stock: 0 },
      { weight: "250g", price: 18, stock: 0 },
    ],
    labels: {
      isNew: false,
      isHot: false,
      isSale: false,
      salePercent: 0,
      isLimited: false,
    },
    rating: 4.5,
    reviewCount: 43,
    active: true,
    featured: false,
    bestSeller: false,
  },
  {
    id: 5,
    slug: "cinnamon-sticks",
    nameEn: "Cinnamon Sticks",
    nameAr: "عيدان القرفة",
    categoryId: 1,
    categorySlug: "arabic-spices",
    type: "single",
    descriptionEn:
      "Premium Ceylon cinnamon sticks. Sweet and delicate flavor perfect for hot drinks and desserts.",
    descriptionAr:
      "عيدان قرفة سيلانية فاخرة. نكهة حلوة ورقيقة مثالية للمشروبات الساخنة والحلويات.",
    images: ["/images/products/cinnamon.jpg"],
    variants: [
      { weight: "100g", price: 10, stock: 60 },
      { weight: "250g", price: 22, stock: 35 },
      { weight: "500g", price: 40, stock: 15 },
    ],
    labels: {
      isNew: true,
      isHot: false,
      isSale: true,
      salePercent: 15,
      isLimited: true,
    },
    rating: 4.7,
    reviewCount: 55,
    active: true,
    featured: true,
    bestSeller: false,
  },
  {
    id: 6,
    slug: "cumin-seeds",
    nameEn: "Cumin Seeds",
    nameAr: "بذور الكمون",
    categoryId: 2,
    categorySlug: "indian-spices",
    type: "single",
    descriptionEn:
      "Aromatic cumin seeds essential for Indian and Middle Eastern cooking.",
    descriptionAr:
      "بذور كمون عطرية أساسية للطبخ الهندي والشرق أوسطي.",
    images: ["/images/products/cumin.jpg"],
    variants: [
      { weight: "250g", price: 10, stock: 90 },
      { weight: "500g", price: 18, stock: 50 },
      { weight: "1kg", price: 32, stock: 25 },
    ],
    labels: {
      isNew: false,
      isHot: true,
      isSale: false,
      salePercent: 0,
      isLimited: false,
    },
    rating: 4.6,
    reviewCount: 78,
    active: true,
    featured: false,
    bestSeller: true,
  },

  // ─── BUNDLE PRODUCTS ───────────────────────────
  {
    id: 7,
    slug: "biryani-spice-pack",
    nameEn: "Biryani Spice Pack",
    nameAr: "باقة بهارات البرياني",
    categoryId: 6,
    categorySlug: "packages-bundles",
    type: "bundle",
    descriptionEn:
      "Everything you need for the perfect biryani. Includes cardamom, cinnamon, cumin, bay leaves, and cloves.",
    descriptionAr:
      "كل ما تحتاجه لبرياني مثالي. يشمل الهيل والقرفة والكمون وورق الغار والقرنفل.",
    images: ["/images/products/biryani-pack.jpg"],
    bundleItems: [
      { productId: 1, nameEn: "Green Cardamom 100g", nameAr: "هيل أخضر 100غ" },
      { productId: 5, nameEn: "Cinnamon Sticks 100g", nameAr: "عيدان قرفة 100غ" },
      { productId: 6, nameEn: "Cumin Seeds 100g", nameAr: "بذور كمون 100غ" },
    ],
    price: 85,
    originalPrice: 105,
    stock: 30,
    variants: [],
    labels: {
      isNew: false,
      isHot: true,
      isSale: true,
      salePercent: 19,
      isLimited: false,
    },
    rating: 4.9,
    reviewCount: 112,
    active: true,
    featured: true,
    bestSeller: true,
  },
  {
    id: 8,
    slug: "ramadan-special-pack",
    nameEn: "Ramadan Special Pack",
    nameAr: "باقة رمضان الخاصة",
    categoryId: 6,
    categorySlug: "packages-bundles",
    type: "bundle",
    descriptionEn:
      "A specially curated collection of spices for Ramadan cooking. Perfect gift for family and friends.",
    descriptionAr:
      "مجموعة بهارات منتقاة خصيصاً للطبخ في رمضان. هدية مثالية للعائلة والأصدقاء.",
    images: ["/images/products/ramadan-pack.jpg"],
    bundleItems: [
      { productId: 2, nameEn: "Premium Saffron 1g", nameAr: "زعفران فاخر 1غ" },
      { productId: 1, nameEn: "Green Cardamom 100g", nameAr: "هيل أخضر 100غ" },
      { productId: 5, nameEn: "Cinnamon Sticks 100g", nameAr: "عيدان قرفة 100غ" },
    ],
    price: 120,
    originalPrice: 150,
    stock: 20,
    variants: [],
    labels: {
      isNew: true,
      isHot: false,
      isSale: true,
      salePercent: 20,
      isLimited: true,
    },
    rating: 4.8,
    reviewCount: 45,
    active: true,
    featured: true,
    bestSeller: false,
  },
];

// ─── HELPER FUNCTIONS ───────────────────────────

// Get all featured products
export const getFeaturedProducts = () =>
  products.filter((p) => p.featured && p.active);

// Get all best sellers
export const getBestSellers = () =>
  products.filter((p) => p.bestSeller && p.active);

// Get products by category
export const getProductsByCategory = (slug) =>
  products.filter((p) => p.categorySlug === slug && p.active);

// Get single product by slug
export const getProductBySlug = (slug) =>
  products.find((p) => p.slug === slug);

// Get single product by id
export const getProductById = (id) =>
  products.find((p) => p.id === id);

// Check if product is sold out
export const isSoldOut = (product) => {
  if (!product) return true;

  // If the API already computed soldOut, trust it
  if (typeof product.soldOut === "boolean") return product.soldOut;

  // Bundles use bundleStock (finished goods units)
  if (product.type === "bundle") {
    const bundleStock = Number(product.bundleStock);
    return !Number.isFinite(bundleStock) || bundleStock <= 0;
  }

  // New stock-first structure for single products:
  // product.stock is an object with currentStockGrams.
  if (product.type === "single" && product.stock && typeof product.stock === "object") {
    const currentGrams = Number(product.stock.currentStockGrams) || 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];

    // If no variants, fallback to grams check only
    if (variants.length === 0) return currentGrams <= 0;

    // Sold out if no variant can be fulfilled by current grams
    const hasAnyAvailableVariant = variants.some((v) => {
      const grams = Number(v?.grams);
      // fallback for legacy shape
      if (!Number.isFinite(grams) || grams <= 0) {
        const legacyStock = Number(v?.stock);
        return Number.isFinite(legacyStock) && legacyStock > 0;
      }
      return currentGrams >= grams;
    });

    return !hasAnyAvailableVariant;
  }

  // Legacy shape fallback
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) {
    const legacyStock = Number(product.stock);
    return !Number.isFinite(legacyStock) || legacyStock <= 0;
  }
  return variants.every((v) => {
    const s = Number(v?.stock);
    return !Number.isFinite(s) || s <= 0;
  });
};

// Get discounted price
export const getDiscountedPrice = (price, salePercent) => {
  if (!salePercent) return price;
  return (price - (price * salePercent) / 100).toFixed(2);
};