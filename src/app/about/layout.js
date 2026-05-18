const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export const metadata = {
  title: "About Al Sadeq Spices | Our Story — Premium Spices Qatar",
  description:
    "Founded in 2018 in Doha, Qatar. Al Sadeq Spices sources the world's finest saffron, cardamom, herbs, and spice blends directly from origin. Learn our story.",
  openGraph: {
    title: "About Al Sadeq Spices | Premium Spices Qatar Since 2018",
    description:
      "Founded in 2018 in Doha. We source the world's finest spices directly from origin — saffron, cardamom, herbs, and authentic blends.",
    url: `${SITE_URL}/about`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutLayout({ children }) {
  return children;
}
