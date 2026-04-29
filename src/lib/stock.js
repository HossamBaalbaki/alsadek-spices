// ─── STOCK / INVENTORY HELPERS ───────────────────────────
// Everything here works in GRAMS as the canonical internal unit.

// Convert a purchase quantity + unit into grams.
export function unitToGrams(quantity, unit) {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "ton":
      return q * 1_000_000;
    case "kilogram":
    case "kg":
      return q * 1000;
    case "gram":
    case "g":
    default:
      return q;
  }
}

// Convert a gram amount into a friendly display string.
// e.g. 2500 -> "2.5 kg", 800 -> "800 g", 1_500_000 -> "1.5 ton"
export function formatGrams(grams) {
  const g = Number(grams) || 0;
  if (g >= 1_000_000) return `${(g / 1_000_000).toFixed(2)} ton`;
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${g.toFixed(0)} g`;
}

// Cost per gram from a purchase transaction.
export function computeCostPerGram(purchasePrice, purchaseQuantity, purchaseUnit) {
  const totalGrams = unitToGrams(purchaseQuantity, purchaseUnit);
  if (!totalGrams) return 0;
  return Number(purchasePrice) / totalGrams;
}

// Weighted average cost per gram when adding a new restock batch.
export function weightedAvgCostPerGram({
  existingGrams,
  existingCostPerGram,
  addedGrams,
  addedCostPerGram,
}) {
  const eg = Number(existingGrams) || 0;
  const ag = Number(addedGrams) || 0;
  const totalGrams = eg + ag;
  if (!totalGrams) return 0;
  const eCost = (Number(existingCostPerGram) || 0) * eg;
  const aCost = (Number(addedCostPerGram) || 0) * ag;
  return (eCost + aCost) / totalGrams;
}

// Parse a weight label like "100g", "1kg", "250 G" into grams.
// Returns 0 for unparseable labels.
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

// For a product with its linked Stock already included, return an array of
// variants enriched with gram count, price, and availability.
// `product` shape expected:
//   - product.type === "single": needs product.stock (Stock row) and product.variants [{ weightLabel, grams }]
//   - product.type === "bundle": needs product.bundleItems with each item.stock loaded
// `applySale` (bool) — whether to include sale discount in computed price.
export function enrichSingleVariants(product) {
  if (!product) return [];
  if (product.type !== "single") return [];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const stock = product.stock;

  // If no variants stored, synthesize one default option so shop always has price/variant
  const normalizedVariants =
    variants.length > 0
      ? variants
      : [{ weightLabel: "100g", grams: 100 }];

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
  const sellPerGram = Number(stock.sellPricePerGram) || 0;
  const currentGrams = Number(stock.currentStockGrams) || 0;

  return normalizedVariants.map((v) => {
    const grams = Number(v.grams || parseWeightLabelToGrams(v.weightLabel || v.weight)) || 0;
    const basePrice = grams * sellPerGram;
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

// For a bundle product, determine how many bundle units can be built from the
// linked stock items. Returns number of units the warehouse can currently ship.
export function computeBundleAvailability(product) {
  if (!product || product.type !== "bundle") return 0;
  const items = Array.isArray(product.bundleItems) ? product.bundleItems : [];
  if (items.length === 0) return 0;
  let minUnits = Infinity;
  for (const item of items) {
    const per = Number(item.gramsPerUnit) || 0;
    const cur = Number(item.stock?.currentStockGrams) || 0;
    if (per <= 0) return 0;
    minUnits = Math.min(minUnits, Math.floor(cur / per));
  }
  return minUnits === Infinity ? 0 : minUnits;
}

// Compute a bundle's cost (sum of gramsPerUnit * costPerGram for each linked stock)
export function computeBundleCost(product) {
  if (!product || product.type !== "bundle") return 0;
  const items = Array.isArray(product.bundleItems) ? product.bundleItems : [];
  return items.reduce((sum, item) => {
    const per = Number(item.gramsPerUnit) || 0;
    const cpg = Number(item.stock?.costPerGram) || 0;
    return sum + per * cpg;
  }, 0);
}

// Determine whether a product is sold out from its enriched state.
export function isProductSoldOut(product) {
  if (!product) return true;
  if (product.type === "bundle") {
    return computeBundleAvailability(product) <= 0;
  }
  // single
  const stock = product.stock;
  const currentGrams = Number(stock?.currentStockGrams) || 0;
  if (currentGrams <= 0) return true;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return true;
  // If none of the variants fit in the current stock, it's sold out.
  const smallestGrams = variants.reduce((min, v) => {
    const g = Number(v.grams || parseWeightLabelToGrams(v.weightLabel || v.weight)) || 0;
    return g > 0 && g < min ? g : min;
  }, Infinity);
  return smallestGrams === Infinity || smallestGrams > currentGrams;
}

// Validate that a sale percent does not drop the sell price below cost.
// Returns { ok: boolean, message?: string }
export function validateSaleAgainstCost({
  sellPricePerGram,
  costPerGram,
  salePercent,
}) {
  const sell = Number(sellPricePerGram) || 0;
  const cost = Number(costPerGram) || 0;
  const pct = Number(salePercent) || 0;
  if (pct <= 0) return { ok: true };
  const discounted = sell * (1 - pct / 100);
  if (discounted < cost) {
    return {
      ok: false,
      message: `Sale price (${discounted.toFixed(3)} QAR/g) is below cost (${cost.toFixed(
        3
      )} QAR/g). Reduce the sale percentage.`,
    };
  }
  return { ok: true };
}

// Validate bundle sale against computed bundle cost.
export function validateBundleSaleAgainstCost({ sellPrice, bundleCost, salePercent }) {
  const sell = Number(sellPrice) || 0;
  const cost = Number(bundleCost) || 0;
  const pct = Number(salePercent) || 0;
  if (pct <= 0) return { ok: true };
  const discounted = sell * (1 - pct / 100);
  if (discounted < cost) {
    return {
      ok: false,
      message: `Bundle sale price (${discounted.toFixed(
        2
      )} QAR) is below bundle cost (${cost.toFixed(2)} QAR).`,
    };
  }
  return { ok: true };
}

export const UNIT_OPTIONS = [
  { value: "gram", labelEn: "Gram (g)", labelAr: "غرام" },
  { value: "kilogram", labelEn: "Kilogram (kg)", labelAr: "كيلوغرام" },
  { value: "ton", labelEn: "Ton", labelAr: "طن" },
];
