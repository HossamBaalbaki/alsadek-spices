const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alsadek-spices.vercel.app";

export const metadata = {
  title: "Contact Us | Al Sadeq Spices — Doha, Qatar",
  description:
    "Get in touch with Al Sadeq Spices. WhatsApp, email, or visit us in Doha, Qatar. We're open daily 8 AM–11 PM. تواصل معنا عبر واتساب أو البريد الإلكتروني.",
  openGraph: {
    title: "Contact Al Sadeq Spices | Doha, Qatar",
    description: "Reach us via WhatsApp or email. Open daily 8 AM–11 PM in Doha, Qatar.",
    url: `${SITE_URL}/contact`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }) {
  return children;
}
