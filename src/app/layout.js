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

// ─── METADATA ───────────────────────────
export const metadata = {
  title: "Al Sadek Spices | الصادق للبهارات",
  description:
    "Premium quality spices delivered fresh to your door in Doha, Qatar. بهارات فاخرة تُوصل طازجة إلى بابك في الدوحة، قطر.",
  keywords:
    "spices, qatar, doha, بهارات, قطر, الدوحة, al sadek, الصادق",
  icons: {
    icon: "/favicon.ico",
  },
};

// ─── ROOT LAYOUT ───────────────────────────
export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${tajawal.variable} antialiased`}>
        {/* Wrap everything with Language and Cart providers */}
        <LanguageProvider>
          <CartProvider>
            {children}
            <CartFlyAnimation />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}