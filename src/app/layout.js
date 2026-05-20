import { Inter, Tajawal } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import CartFlyAnimation from "@/components/ui/CartFlyAnimation";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Al Sadeq Spices — Premium Spices Delivered in Qatar",
    description:
      "Shop 100+ premium spices online. Delivered fresh to your door in Doha, Qatar.",
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
            <FloatingWhatsApp />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}