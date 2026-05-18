import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

function getFirstPrice(stock) {
  if (stock.type === "bundle") return Number(stock.price || 0);
  const variants = Array.isArray(stock.variants) ? stock.variants : [];
  return Number(variants[0]?.price || 0);
}

export async function generateMetadata({ params }) {
  let stock = null;
  try {
    stock = await prisma.stock.findUnique({
      where: { slug: params.slug },
      select: {
        nameEn: true, nameAr: true, descriptionEn: true, images: true,
        type: true, variants: true, price: true, currentStockPcs: true,
        rating: true, reviewCount: true, category: { select: { nameEn: true, slug: true } },
      },
    });
  } catch { /* non-fatal */ }

  if (!stock) {
    return {
      title: "Product Not Found | Al Sadeq Spices",
      robots: { index: false, follow: false },
    };
  }

  const price = getFirstPrice(stock);
  const image = stock.images?.[0] || `${SITE_URL}/og-image.jpg`;
  const canonicalUrl = `${SITE_URL}/product/${params.slug}`;

  const title = `${stock.nameEn} | Al Sadeq Spices Qatar`;
  const description =
    stock.descriptionEn ||
    `Buy ${stock.nameEn} online from Al Sadeq Spices — premium quality${stock.category?.nameEn ? ` ${stock.category.nameEn}` : " spice"} delivered fresh in Doha, Qatar.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: stock.nameEn }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: canonicalUrl },
  };
}

export default async function ProductLayout({ children, params }) {
  let stock = null;
  try {
    stock = await prisma.stock.findUnique({
      where: { slug: params.slug },
      select: {
        nameEn: true, nameAr: true, descriptionEn: true, images: true,
        type: true, variants: true, price: true, currentStockPcs: true,
        rating: true, reviewCount: true, category: { select: { nameEn: true, slug: true } },
      },
    });
  } catch { /* non-fatal */ }

  if (!stock) return <>{children}</>;

  const price = getFirstPrice(stock);
  const image = stock.images?.[0] || `${SITE_URL}/og-image.jpg`;
  const inStock = stock.currentStockPcs > 0;
  const canonicalUrl = `${SITE_URL}/product/${params.slug}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: stock.nameEn,
    description: stock.descriptionEn || `Premium ${stock.nameEn} from Al Sadeq Spices, Qatar.`,
    image: stock.images?.length ? stock.images : [image],
    brand: { "@type": "Brand", name: "Al Sadeq Spices" },
    url: canonicalUrl,
    ...(stock.category && {
      category: stock.category.nameEn,
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "QAR",
      price: price > 0 ? price.toFixed(2) : undefined,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Al Sadeq Spices" },
      url: canonicalUrl,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    ...(stock.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: stock.rating.toFixed(1),
        reviewCount: stock.reviewCount,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ...(stock.category
        ? [{ "@type": "ListItem", position: 3, name: stock.category.nameEn, item: `${SITE_URL}/shop?category=${stock.category.slug}` }]
        : []),
      { "@type": "ListItem", position: stock.category ? 4 : 3, name: stock.nameEn, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
