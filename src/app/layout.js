import { Inter, Tajawal } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import CartFlyAnimation from "@/components/ui/CartFlyAnimation";

// ─── FONTS ───────────────────────────
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  display: "swap",
});

// ─── SITE URL ───────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

// ─── METADATA ───────────────────────────
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Al Sadeq Spices | الصادق للبهارات — Premium Spices in Qatar",
    template: "%s | Al Sadeq Spices",
  },
  description:
    "Premium quality spices delivered fresh to your door in Doha, Qatar. Shop saffron, cardamom, za'atar, and 100+ authentic spices. Free delivery available. بهارات فاخرة تُوصل طازجة إلى بابك في الدوحة، قطر.",
  keywords: [
    "spices qatar", "doha spices", "buy spices online qatar",
    "premium spices doha", "saffron qatar", "cardamom doha",
    "arabic spices", "spice delivery qatar", "al sadeq spices",
    "الصادق للبهارات", "بهارات قطر", "بهارات الدوحة", "توصيل بهارات",
  ],
  authors: [{ name: "Al Sadeq Spices", url: SITE_URL }],
  creator: "Al Sadeq Spices",
  publisher: "Al Sadeq Spices",
  category: "Food & Grocery",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_QA",
    alternateLocale: "ar_QA",
    url: SITE_URL,
    siteName: "Al Sadeq Spices",
    title: "Al Sadeq Spices — Premium Spices Delivered in Qatar",
    description:
      "Shop 100+ premium spices online. Saffron, cardamom, za'atar, and more — delivered fresh to your door in Doha, Qatar.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Al Sadeq Spices — Premium Spices in Qatar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Al Sadeq Spices — Premium Spices Delivered in Qatar",
    description:
      "Shop 100+ premium spices online. Delivered fresh to your door in Doha, Qatar.",
    images: [OG_IMAGE],
    creator: "@alsadeqspices",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// ─── ORGANIZATION + LOCAL BUSINESS + WEBSITE SCHEMA ───────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Al Sadeq Spices",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.ico`,
        width: 32,
        height: 32,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+974-0000-0000",
        contactType: "customer service",
        availableLanguage: ["English", "Arabic"],
      },
      sameAs: [
        process.env.NEXT_PUBLIC_INSTAGRAM_URL,
        process.env.NEXT_PUBLIC_FACEBOOK_URL,
        process.env.NEXT_PUBLIC_TIKTOK_URL,
      ].filter(Boolean),
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "Al Sadeq Spices",
      description:
        "Premium quality spices delivered fresh to your door in Doha, Qatar.",
      url: SITE_URL,
      telephone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+974-0000-0000",
      email: "info@alsadek.qa",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Doha",
        addressCountry: "QA",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 25.2854,
        longitude: 51.531,
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        opens: "08:00",
        closes: "23:00",
      },
      priceRange: "QAR 5–500",
      currenciesAccepted: "QAR",
      paymentAccepted: "Cash, Credit Card",
      image: OG_IMAGE,
      servesCuisine: "Middle Eastern",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Al Sadeq Spices",
      description: "Premium quality spices delivered fresh in Doha, Qatar.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?search={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
      inLanguage: ["en", "ar"],
    },
  ],
};

// ─── ROOT LAYOUT ───────────────────────────
export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${tajawal.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <LanguageProvider>
          <CartProvider>
            {children}
            <CartFlyAnimation />
            {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-float"
                aria-label="Chat on WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}