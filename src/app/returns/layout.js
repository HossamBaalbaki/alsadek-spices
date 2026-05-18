const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export const metadata = {
  title: "Returns & Refunds Policy | Al Sadeq Spices Qatar",
  description: "Al Sadeq Spices return and refund policy. Learn how to return products and get a refund in Qatar.",
  alternates: { canonical: `${SITE_URL}/returns` },
};

export default function ReturnsLayout({ children }) {
  return children;
}
