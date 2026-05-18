const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export const metadata = {
  title: "Terms & Conditions | Al Sadeq Spices Qatar",
  description: "Read the terms and conditions for using Al Sadeq Spices website and placing orders in Qatar.",
  robots: { index: true, follow: false },
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsLayout({ children }) {
  return children;
}
