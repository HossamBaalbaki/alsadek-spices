/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",   value: "on" },
  { key: "X-Frame-Options",          value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      isProd
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.cloudinary.com https://pub-233449cd95484981a46fd69460d65453.r2.dev",
      "frame-src https://maps.google.com https://www.google.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";

const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/lib/r2-loader.js",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "pub-233449cd95484981a46fd69460d65453.r2.dev",
      },
    ],
  },
  async headers() {
    const routes = [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];

    if (allowedOrigin) {
      routes.push({
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin",  value: allowedOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      });
    }

    return routes;
  },
};

export default nextConfig;
