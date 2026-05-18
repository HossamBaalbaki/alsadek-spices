import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Must be nodejs (not edge) because Prisma requires Node.js runtime
export const runtime = "nodejs";

function getFirstPrice(stock) {
  if (stock.type === "bundle") return Number(stock.price || 0);
  const variants = Array.isArray(stock.variants) ? stock.variants : [];
  return Number(variants[0]?.price || 0);
}

export default async function Image({ params }) {
  let stock = null;
  try {
    stock = await prisma.stock.findUnique({
      where: { slug: params.slug },
      select: {
        nameEn: true,
        images: true,
        type: true,
        variants: true,
        price: true,
        currentStockPcs: true,
        category: { select: { nameEn: true } },
      },
    });
  } catch { /* fallback to brand card */ }

  // ─── Fallback — no product found ─────────────────────────────────────────
  if (!stock) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1c1917", fontFamily: "system-ui, sans-serif" }}>
        <span style={{ fontSize: 80, display: "flex" }}>🌶️</span>
        <span style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginLeft: 24, display: "flex" }}>Al Sadeq Spices</span>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const price = getFirstPrice(stock);
  const inStock = stock.currentStockPcs > 0;
  const productImage = stock.images?.[0];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#1c1917",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #92400e, #d97706, #fbbf24, #d97706, #92400e)", display: "flex" }} />

      {/* Left — Product Image */}
      <div
        style={{
          width: 480,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#292524",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {productImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImage}
            alt={stock.nameEn}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 140, display: "flex", opacity: 0.6 }}>🌶️</span>
        )}
        {/* Gradient overlay on right edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 120,
            height: "100%",
            background: "linear-gradient(90deg, transparent, #1c1917)",
            display: "flex",
          }}
        />
      </div>

      {/* Right — Product Info */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 60px 0 48px",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <span style={{ fontSize: 22, display: "flex" }}>🌶️</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#d97706", letterSpacing: "3px", display: "flex" }}>
            AL SADEQ SPICES
          </span>
        </div>

        {/* Category */}
        {stock.category?.nameEn && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#78716c",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: 12,
              display: "flex",
            }}
          >
            {stock.category.nameEn}
          </span>
        )}

        {/* Product Name */}
        <h1
          style={{
            fontSize: stock.nameEn.length > 24 ? 42 : 52,
            fontWeight: 900,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-1px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {stock.nameEn}
        </h1>

        {/* Price + Availability */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 28 }}>
          {price > 0 && (
            <span
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#fbbf24",
                display: "flex",
                letterSpacing: "-1px",
              }}
            >
              {price.toFixed(2)} QAR
            </span>
          )}
          <span
            style={{
              padding: "6px 16px",
              background: inStock ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${inStock ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 700,
              color: inStock ? "#4ade80" : "#f87171",
              display: "flex",
            }}
          >
            {inStock ? "✓ In Stock" : "Out of Stock"}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 48, height: 2, background: "#44403c", borderRadius: 1, marginTop: 32, display: "flex" }} />

        {/* Site URL */}
        <span style={{ fontSize: 15, color: "#57534e", marginTop: 20, display: "flex" }}>
          alsadek-spices.vercel.app
        </span>
      </div>

      {/* Bottom accent */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #92400e, #d97706, #fbbf24, #d97706, #92400e)", display: "flex" }} />
    </div>,
    { width: 1200, height: 630 }
  );
}
