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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #1c1917 0%, #292524 60%, #1c1917 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background watermark */}
      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          fontSize: 360,
          opacity: 0.04,
          lineHeight: 1,
          display: "flex",
        }}
      >
        🌶️
      </div>

      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: "linear-gradient(90deg, #92400e, #d97706, #fbbf24, #d97706, #92400e)",
          display: "flex",
        }}
      />

      {/* Logo block */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            background: "linear-gradient(135deg, #92400e, #b45309)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            boxShadow: "0 8px 32px rgba(217,119,6,0.4)",
          }}
        >
          🌶️
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
              display: "flex",
            }}
          >
            Al Sadeq
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#d97706",
              letterSpacing: "6px",
              display: "flex",
            }}
          >
            SPICES
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 64,
          height: 3,
          background: "linear-gradient(90deg, transparent, #d97706, transparent)",
          borderRadius: 2,
          marginBottom: 32,
          display: "flex",
        }}
      />

      {/* Tagline */}
      <p
        style={{
          fontSize: 30,
          color: "#d6d3d1",
          textAlign: "center",
          margin: 0,
          fontWeight: 400,
          letterSpacing: "0.5px",
          display: "flex",
        }}
      >
        Premium Quality Spices · Doha, Qatar
      </p>

      {/* Sub-tagline */}
      <p
        style={{
          fontSize: 18,
          color: "#57534e",
          textAlign: "center",
          margin: "14px 0 0",
          display: "flex",
        }}
      >
        Saffron · Cardamom · Za'atar · 100+ Spices
      </p>

      {/* Bottom accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, #92400e, #d97706, #fbbf24, #d97706, #92400e)",
          display: "flex",
        }}
      />
    </div>,
    { width: 1200, height: 630 }
  );
}
