import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(145deg, #1c1917 0%, #292524 60%, #1c1917 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #92400e, #d97706, #fbbf24, #d97706, #92400e)", display: "flex" }} />

      {/* Left content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 72px",
          flex: 1,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #92400e, #b45309)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
            🌶️
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#d97706", letterSpacing: "2px", display: "flex" }}>
            AL SADEQ SPICES
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 68, fontWeight: 900, color: "#ffffff", margin: 0, lineHeight: 1.05, letterSpacing: "-2px", display: "flex", flexDirection: "column" }}>
          <span>Shop Premium</span>
          <span style={{ color: "#fbbf24" }}>Spices Online</span>
        </h1>

        {/* Description */}
        <p style={{ fontSize: 22, color: "#a8a29e", margin: "24px 0 0", lineHeight: 1.5, display: "flex", maxWidth: 500 }}>
          100+ authentic spices, herbs &amp; blends. Fast delivery across Doha, Qatar.
        </p>

        {/* Tags */}
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          {["Saffron", "Cardamom", "Za'atar", "Sumac"].map((tag) => (
            <span
              key={tag}
              style={{
                padding: "8px 18px",
                background: "rgba(217,119,6,0.15)",
                border: "1px solid rgba(217,119,6,0.3)",
                borderRadius: 100,
                fontSize: 15,
                color: "#fbbf24",
                fontWeight: 600,
                display: "flex",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right decorative */}
      <div
        style={{
          width: 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 220,
          opacity: 0.08,
        }}
      >
        🌿
      </div>

      {/* Bottom accent */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #92400e, #d97706, #fbbf24, #d97706, #92400e)", display: "flex" }} />
    </div>,
    { width: 1200, height: 630 }
  );
}
