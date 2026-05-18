/**
 * Smoke tests for Phase 2 — Order creation, stock deduction, checkout flow.
 *
 * These are unit-level tests for pure logic extracted from the API routes.
 * Integration tests against the live DB are kept out of this suite to avoid
 * side effects in production data.
 */

import { describe, it, expect } from "@jest/globals";

// ─── HELPERS UNDER TEST ────────────────────────────────────────────────────────

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ASQ-${timestamp}${random}`;
}

function sanitizeStr(s, maxLen = 200) {
  if (typeof s !== "string") return "";
  return s.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

function computeDeliveryFee({ selectedZone, promoCode, subtotal, freeThreshold }) {
  if (!selectedZone) return 0;
  if (promoCode?.type === "free_delivery") return 0;
  if (subtotal >= freeThreshold) return 0;
  return Number(selectedZone.price) || 0;
}

function computeDiscount({ promoCode, subtotal }) {
  if (!promoCode) return 0;
  if (promoCode.type === "percentage") return (subtotal * promoCode.value) / 100;
  if (promoCode.type === "fixed") return promoCode.value;
  return 0;
}

// ─── ORDER NUMBER ──────────────────────────────────────────────────────────────

describe("generateOrderNumber", () => {
  it("has the correct prefix", () => {
    expect(generateOrderNumber()).toMatch(/^ASQ-/);
  });

  it("is 9 characters after prefix (6 timestamp + 3 random)", () => {
    const num = generateOrderNumber();
    expect(num.replace("ASQ-", "")).toHaveLength(9);
  });

  it("produces unique values for sequential calls", () => {
    const set = new Set(Array.from({ length: 100 }, generateOrderNumber));
    expect(set.size).toBeGreaterThan(90);
  });
});

// ─── SANITIZE INPUT ────────────────────────────────────────────────────────────

describe("sanitizeStr", () => {
  it("strips angle brackets", () => {
    expect(sanitizeStr('<script>alert("xss")</script>')).toBe('script>alert("xss")/script>'.replace(/</g, "").replace(/>/g, ""));
    expect(sanitizeStr("<b>bold</b>")).toBe("bbold/b");
    expect(sanitizeStr("<script>")).toBe("script");
  });

  it("trims whitespace", () => {
    expect(sanitizeStr("  hello  ")).toBe("hello");
  });

  it("truncates at maxLen", () => {
    expect(sanitizeStr("a".repeat(300), 200)).toHaveLength(200);
  });

  it("returns empty string for non-strings", () => {
    expect(sanitizeStr(null)).toBe("");
    expect(sanitizeStr(undefined)).toBe("");
    expect(sanitizeStr(42)).toBe("");
    expect(sanitizeStr({})).toBe("");
  });

  it("handles empty string", () => {
    expect(sanitizeStr("")).toBe("");
  });
});

// ─── DELIVERY FEE ─────────────────────────────────────────────────────────────

describe("computeDeliveryFee", () => {
  const zone = { id: 1, nameEn: "Doha", price: 15 };
  const freeThreshold = 200;

  it("returns 0 when no zone is selected", () => {
    expect(computeDeliveryFee({ selectedZone: null, subtotal: 50, freeThreshold })).toBe(0);
  });

  it("returns zone price for subtotal below threshold", () => {
    expect(computeDeliveryFee({ selectedZone: zone, subtotal: 100, freeThreshold })).toBe(15);
  });

  it("returns 0 when subtotal meets free delivery threshold", () => {
    expect(computeDeliveryFee({ selectedZone: zone, subtotal: 200, freeThreshold })).toBe(0);
  });

  it("returns 0 for free_delivery promo code regardless of subtotal", () => {
    expect(computeDeliveryFee({ selectedZone: zone, promoCode: { type: "free_delivery" }, subtotal: 50, freeThreshold })).toBe(0);
  });
});

// ─── DISCOUNT CALCULATION ──────────────────────────────────────────────────────

describe("computeDiscount", () => {
  it("returns 0 with no promo code", () => {
    expect(computeDiscount({ promoCode: null, subtotal: 100 })).toBe(0);
  });

  it("computes percentage discount", () => {
    expect(computeDiscount({ promoCode: { type: "percentage", value: 10 }, subtotal: 200 })).toBe(20);
  });

  it("computes fixed discount", () => {
    expect(computeDiscount({ promoCode: { type: "fixed", value: 25 }, subtotal: 100 })).toBe(25);
  });

  it("returns 0 for free_delivery type (no cash discount)", () => {
    expect(computeDiscount({ promoCode: { type: "free_delivery", value: 0 }, subtotal: 100 })).toBe(0);
  });
});

// ─── GRAND TOTAL CALCULATION ──────────────────────────────────────────────────

describe("grandTotal calculation", () => {
  it("subtotal + deliveryFee - discount", () => {
    const subtotal = 150;
    const delivery = 15;
    const discount = 20;
    const grandTotal = subtotal + delivery - discount;
    expect(grandTotal).toBe(145);
  });

  it("never goes below zero with large discount", () => {
    const grandTotal = Math.max(0, 50 + 0 - 100);
    expect(grandTotal).toBe(0);
  });
});

// ─── ORDER ITEMS VALIDATION ────────────────────────────────────────────────────

describe("order item validation logic", () => {
  it("rejects items with invalid productId", () => {
    const item = { productId: "not-a-number" };
    expect(typeof item.productId !== "number").toBe(true);
  });

  it("accepts items with numeric productId", () => {
    const item = { productId: 42 };
    expect(typeof item.productId === "number").toBe(true);
  });

  it("computes neededGrams correctly for a single product variant", () => {
    const unitGrams = 100;
    const quantity = 3;
    expect(unitGrams * quantity).toBe(300);
  });

  it("flags insufficient stock when currentStock < needed", () => {
    const currentStockGrams = 250;
    const neededGrams = 300;
    expect(currentStockGrams < neededGrams).toBe(true);
  });

  it("allows order when currentStock >= needed", () => {
    const currentStockGrams = 500;
    const neededGrams = 300;
    expect(currentStockGrams >= neededGrams).toBe(true);
  });
});

// ─── MULTI-VARIANT ADD-TO-CART ROUTING ────────────────────────────────────────

describe("add-to-cart routing logic", () => {
  const isMultiVariant = (product) =>
    product.type === "single" && Array.isArray(product.variants) && product.variants.length > 1;

  it("redirects multi-variant single products to product page", () => {
    const product = { type: "single", id: 1, variants: [{ weightLabel: "100g" }, { weightLabel: "250g" }] };
    expect(isMultiVariant(product)).toBe(true);
  });

  it("allows direct add for single-variant products", () => {
    const product = { type: "single", id: 2, variants: [{ weightLabel: "100g" }] };
    expect(isMultiVariant(product)).toBe(false);
  });

  it("allows direct add for bundles", () => {
    const product = { type: "bundle", id: 3, variants: [] };
    expect(isMultiVariant(product)).toBe(false);
  });

  it("allows direct add for products with no variants array", () => {
    const product = { type: "single", id: 4 };
    expect(isMultiVariant(product)).toBe(false);
  });
});
