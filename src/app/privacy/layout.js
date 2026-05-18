const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export const metadata = {
  title: "Privacy Policy | Al Sadeq Spices Qatar",
  description: "Al Sadeq Spices privacy policy — how we collect, use, and protect your personal data in Qatar.",
  robots: { index: true, follow: false },
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyLayout({ children }) {
  return children;
}
