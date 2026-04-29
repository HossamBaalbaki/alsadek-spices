export const categories = [
  {
    id: 1,
    slug: "arabic-spices",
    nameEn: "Arabic Spices",
    nameAr: "بهارات عربية",
    image: "/images/categories/arabic-spices.jpg",
    productCount: 24,
    active: true,
  },
  {
    id: 2,
    slug: "indian-spices",
    nameEn: "Indian Spices",
    nameAr: "بهارات هندية",
    image: "/images/categories/indian-spices.jpg",
    productCount: 18,
    active: true,
  },
  {
    id: 3,
    slug: "iranian-spices",
    nameEn: "Iranian Spices",
    nameAr: "بهارات إيرانية",
    image: "/images/categories/iranian-spices.jpg",
    productCount: 12,
    active: true,
  },
  {
    id: 4,
    slug: "salt-pepper",
    nameEn: "Salt & Pepper",
    nameAr: "ملح وفلفل",
    image: "/images/categories/salt-pepper.jpg",
    productCount: 8,
    active: true,
  },
  {
    id: 5,
    slug: "nuts-dried-fruits",
    nameEn: "Nuts & Dried Fruits",
    nameAr: "مكسرات وفواكه مجففة",
    image: "/images/categories/nuts.jpg",
    productCount: 15,
    active: true,
  },
  {
    id: 6,
    slug: "packages-bundles",
    nameEn: "Packages & Bundles",
    nameAr: "عروض وباقات",
    image: "/images/categories/bundles.jpg",
    productCount: 6,
    active: true,
  },
];

// ─── HELPER FUNCTIONS ───────────────────────────

// Get all active categories
export const getActiveCategories = () =>
  categories.filter((c) => c.active);

// Get category by slug
export const getCategoryBySlug = (slug) =>
  categories.find((c) => c.slug === slug);

// Get category by id
export const getCategoryById = (id) =>
  categories.find((c) => c.id === id);