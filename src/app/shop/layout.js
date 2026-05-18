const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export const metadata = {
  title: "Shop Premium Spices Online | Al Sadeq Spices Qatar",
  description:
    "Browse 100+ premium spices, herbs, and blends. Shop saffron, cardamom, za'atar, sumac, and more. Fast delivery across Doha, Qatar. تسوق أفضل البهارات الفاخرة في قطر.",
  keywords: [
    "buy spices online qatar", "spice shop doha", "online spice store qatar",
    "premium spices qatar", "arabic spice store", "saffron buy doha",
    "cardamom qatar", "za'atar online", "sumac spice qatar",
  ],
  openGraph: {
    title: "Shop Premium Spices | Al Sadeq Spices Qatar",
    description: "Browse 100+ premium spices, herbs, and blends. Fast delivery across Doha.",
    url: `${SITE_URL}/shop`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/shop` },
};

export default function ShopLayout({ children }) {
  return children;
}
