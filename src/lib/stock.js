// ─── STOCK / INVENTORY HELPERS ───────────────────────────

// Convert a purchase quantity + unit into grams.
function unitToGrams(quantity, unit) {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "ton":      return q * 1_000_000;
    case "kilogram":
    case "kg":       return q * 1000;
    default:         return q;
  }
}

// Parse a weight label like "100g", "1kg", "250 G" into grams.
export function parseWeightLabelToGrams(label) {
  if (label == null) return 0;
  if (typeof label === "number") return label;
  const s = String(label).trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^([\d.]+)\s*(kg|g|ton)?$/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  const unit = m[2] || "g";
  return unitToGrams(n, unit === "kg" ? "kilogram" : unit === "ton" ? "ton" : "gram");
}

// Enrich single-product variants with sale pricing and availability.
// Still used by /api/products/id/[id] (legacy id-based product lookup).
export function enrichSingleVariants(product) {
  if (!product || product.type !== "single") return [];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const stock = product.stock;

  const normalizedVariants =
    variants.length > 0 ? variants : [{ weightLabel: "100g", grams: 100, price: 0 }];

  if (!stock) {
    return normalizedVariants.map((v) => ({
      weightLabel: v.weightLabel || v.weight || "",
      grams: Number(v.grams || parseWeightLabelToGrams(v.weightLabel || v.weight)) || 0,
      price: 0,
      available: false,
    }));
  }

  const labels = product.labels || {};
  const salePct =
    labels.isSale && Number(labels.salePercent) > 0 ? Number(labels.salePercent) : 0;
  const currentGrams = Number(stock.currentStockGrams) || 0;

  return normalizedVariants.map((v) => {
    const grams = Number(v.grams || parseWeightLabelToGrams(v.weightLabel || v.weight)) || 0;
    const basePrice = Number(v.price) || 0;
    const finalPrice = salePct > 0 ? basePrice * (1 - salePct / 100) : basePrice;
    return {
      weightLabel: v.weightLabel || v.weight || `${grams}g`,
      grams,
      price: Math.round(finalPrice * 100) / 100,
      originalPrice: salePct > 0 ? Math.round(basePrice * 100) / 100 : null,
      available: grams > 0 && grams <= currentGrams,
    };
  });
}
