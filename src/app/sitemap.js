import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export default async function sitemap() {
  const now = new Date();

  // ─── Static public routes ────────────────────────────────────────────────
  const staticRoutes = [
    { url: `${SITE_URL}/`,        lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/shop`,    lastModified: now, changeFrequency: "daily",   priority: 0.95 },
    { url: `${SITE_URL}/about`,   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`,     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/terms`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  // ─── Dynamic product pages ───────────────────────────────────────────────
  let productRoutes = [];
  try {
    const stocks = await prisma.stock.findMany({
      where: { active: true, slug: { not: null } },
      select: { slug: true, updatedAt: true, featured: true, bestSeller: true },
    });
    productRoutes = stocks.map((s) => ({
      url: `${SITE_URL}/product/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: s.featured || s.bestSeller ? 0.95 : 0.85,
    }));
  } catch {
    // Non-fatal: sitemap still valid with static routes
  }

  // ─── Category shop pages ─────────────────────────────────────────────────
  let categoryRoutes = [];
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });
    categoryRoutes = categories.map((c) => ({
      url: `${SITE_URL}/shop?category=${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // Non-fatal
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
