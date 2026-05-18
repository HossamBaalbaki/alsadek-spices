import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import CartFlyAnimation from "@/components/ui/CartFlyAnimation";

// ─── FONTS ───────────────────────────
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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