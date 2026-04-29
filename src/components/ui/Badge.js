"use client";

import { useLanguage } from "@/context/LanguageContext";

// ─── SINGLE BADGE COMPONENT ───────────────────────────
export function Badge({ type, salePercent }) {
  const { t } = useLanguage();

  const badges = {
    new: {
      label: t.labels.new,
      className: "badge badge-new",
    },
    hot: {
      label: t.labels.hot,
      className: "badge badge-hot",
    },
    sale: {
      label: salePercent
        ? `-${salePercent}% ${t.labels.off}`
        : t.labels.sale,
      className: "badge badge-sale",
    },
    limited: {
      label: t.labels.limited,
      className: "badge badge-limited",
    },
    soldOut: {
      label: t.labels.soldOut,
      className: "badge badge-soldout",
    },
    bundle: {
      label: t.labels.bundle,
      className: "badge badge-bundle",
    },
    bestSeller: {
      label: t.labels.bestSeller,
      className: "badge badge-hot",
    },
  };

  const badge = badges[type];
  if (!badge) return null;

  return (
    <span className={badge.className}>
      {badge.label}
    </span>
  );
}

// ─── PRODUCT BADGES GROUP ───────────────────────────
// Shows all badges for a product
// Used on product cards and product detail page
export function ProductBadges({ labels, isSoldOut, position = "card" }) {
  const { t } = useLanguage();

  if (!labels) return null;

  // Collect all active badges
  const activeBadges = [];

  // Sold out takes priority — show only sold out
  if (isSoldOut) {
    activeBadges.push({ type: "soldOut" });
  } else {
    if (labels.isNew) activeBadges.push({ type: "new" });
    if (labels.isHot) activeBadges.push({ type: "hot" });
    if (labels.isSale)
      activeBadges.push({
        type: "sale",
        salePercent: labels.salePercent,
      });
    if (labels.isLimited) activeBadges.push({ type: "limited" });
  }

  if (activeBadges.length === 0) return null;

  // Position styles
  const positionStyles = {
    // On product card — top left corner
    card: "absolute top-2 left-2 flex flex-col gap-1 z-10",
    // On product detail page — inline
    detail: "flex flex-wrap gap-2",
  };

  return (
    <div className={positionStyles[position]}>
      {activeBadges.map((badge, index) => (
        <Badge
          key={index}
          type={badge.type}
          salePercent={badge.salePercent}
        />
      ))}
    </div>
  );
}

// ─── SOLD OUT OVERLAY ───────────────────────────
// Grey overlay on sold out product cards
export function SoldOutOverlay() {
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-t-lg">
      <div className="bg-stone-600 text-white px-4 py-2 rounded-full font-bold text-sm rotate-[-15deg] shadow-lg">
        {t.labels.soldOut}
      </div>
    </div>
  );
}

// ─── SAVINGS BADGE ───────────────────────────
// Shows how much customer saves
// Used on bundle products
export function SavingsBadge({ originalPrice, currentPrice }) {
  const { t } = useLanguage();

  const savings = originalPrice - currentPrice;
  if (savings <= 0) return null;

  return (
    <div className="savings-badge">
      <span>🎉</span>
      <span>
        {t.product.save} {savings} {t.general.qar}
      </span>
    </div>
  );
}

// ─── STOCK BADGE ───────────────────────────
// Shows stock status
export function StockBadge({ stock, type }) {
  const { t } = useLanguage();

  // Bundle type uses single stock number
  if (type === "bundle") {
    if (stock === 0) {
      return (
        <span className="text-xs font-semibold text-red-600">
          ● {t.product.soldOut}
        </span>
      );
    }
    if (stock <= 10) {
      return (
        <span className="text-xs font-semibold text-orange-500">
          ● {t.product.lowStock}
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold text-green-600">
        ● {t.product.inStock}
      </span>
    );
  }

  return null;
}