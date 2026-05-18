const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export const metadata = {
  title: "FAQ — Frequently Asked Questions | Al Sadeq Spices Qatar",
  description:
    "Answers to common questions about Al Sadeq Spices: delivery times, payment methods, return policy, product quality, and more. الأسئلة الشائعة.",
  openGraph: {
    title: "FAQ | Al Sadeq Spices Qatar",
    description: "Delivery, payment, returns, and product quality — all your questions answered.",
    url: `${SITE_URL}/faq`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqLayout({ children }) {
  return children;
}
