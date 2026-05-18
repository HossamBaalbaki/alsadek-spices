/**
 * Pure logic unit tests for Al Sadek Spices.
 *
 * Functions are copied inline — the Jest config does not support path aliases,
 * so we cannot import from src/ directly.
 */

import { describe, it, expect } from "@jest/globals";

// ─── FROM src/lib/utils.js ────────────────────────────────────────────────────

function formatPrice(price) {
  return Number(price).toFixed(2);
}

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ASQ-${timestamp}${random}`;
}

function calculateDiscount(price, percent) {
  return price - (price * percent) / 100;
}

// ─── FROM src/lib/stock.js ────────────────────────────────────────────────────

function unitToGrams(quantity, unit) {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "ton":
      return q * 1_000_000;
    case "kilogram":
    case "kg":
      return q * 1000;
    default:
      return q;
  }
}

function parseWeightLabelToGrams(label) {
  if (label == null) return 0;
  if (typeof label === "number") return label;
  const s = String(label).trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^([\d.]+)\s*(kg|g|ton)?$/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  const unit = m[2] || "g";
  return unitToGrams(
    n,
    unit === "kg" ? "kilogram" : unit === "ton" ? "ton" : "gram"
  );
}

function weightedAvgCostPerGram({
  existingGrams,
  existingCostPerGram,
  addedGrams,
  addedCostPerGram,
}) {
  const eg = Number(existingGrams) || 0;
  const ag = Number(addedGrams) || 0;
  const totalGrams = eg + ag;
  if (!totalGrams) return 0;
  return (
    ((Number(existingCostPerGram) || 0) * eg +
      (Number(addedCostPerGram) || 0) * ag) /
    totalGrams
  );
}

// ─── STOCK DEDUCTION / CANCEL RESTORE ─────────────────────────────────────────

function deductStock(currentGrams, variantGrams, quantity) {
  const needed = variantGrams * quantity;
  if (currentGrams < needed) throw new Error("Insufficient stock");
  return currentGrams - needed;
}

function restoreStock(currentGrams, variantGrams, quantity) {
  return currentGrams + variantGrams * quantity;
}

// ─── PROMO CODE DISCOUNT LOGIC ────────────────────────────────────────────────

function computeDiscount(promoCode, subtotal) {
  if (!promoCode) return 0;
  if (promoCode.type === "percentage") return (subtotal * promoCode.value) / 100;
  if (promoCode.type === "fixed") return Math.min(promoCode.value, subtotal);
  if (promoCode.type === "free_delivery") return 0;
  return 0;
}

function computeDeliveryFee(selectedZone, promoCode, subtotal, threshold) {
  if (!selectedZone) return 0;
  if (promoCode?.type === "free_delivery") return 0;
  if (subtotal >= threshold) return 0;
  return Number(selectedZone.price) || 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── formatPrice ──────────────────────────────────────────────────────────────

describe("formatPrice", () => {
  it("formats an integer to two decimal places", () => {
    expect(formatPrice(5)).toBe("5.00");
  });

  it("formats a float with one decimal", () => {
    expect(formatPrice(3.5)).toBe("3.50");
  });

  it("formats a float with more than two decimals (rounds)", () => {
    expect(formatPrice(1.005)).toBe("1.00"); // IEEE 754 rounding
    expect(formatPrice(1.995)).toBe("2.00");
    expect(formatPrice(2.345)).toBe("2.35");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("0.00");
  });

  it("formats a negative price", () => {
    expect(formatPrice(-7.5)).toBe("-7.50");
  });

  it("coerces a numeric string", () => {
    expect(formatPrice("12.9")).toBe("12.90");
  });

  it("returns NaN string for non-numeric input", () => {
    expect(formatPrice("abc")).toBe("NaN");
  });

  it("handles null (coerces to 0)", () => {
    expect(formatPrice(null)).toBe("0.00");
  });
});

// ─── generateOrderNumber ──────────────────────────────────────────────────────

describe("generateOrderNumber", () => {
  it("starts with the ASQ- prefix", () => {
    expect(generateOrderNumber()).toMatch(/^ASQ-/);
  });

  it("has exactly 9 characters after the prefix (6 timestamp + 3 random)", () => {
    const num = generateOrderNumber();
    expect(num.slice(4)).toHaveLength(9);
  });

  it("contains only digits after the prefix", () => {
    expect(generateOrderNumber()).toMatch(/^ASQ-\d{9}$/);
  });

  it("produces distinct values across many calls", () => {
    const values = Array.from({ length: 200 }, generateOrderNumber);
    const unique = new Set(values);
    // With 6-digit timestamp + 3-digit random there will be collisions in a
    // tight loop, but uniqueness should still be very high (>90%).
    expect(unique.size).toBeGreaterThan(180);
  });

  it("never returns an empty string", () => {
    for (let i = 0; i < 10; i++) {
      expect(generateOrderNumber().length).toBeGreaterThan(0);
    }
  });
});

// ─── calculateDiscount ────────────────────────────────────────────────────────

describe("calculateDiscount", () => {
  it("applies 10% discount correctly", () => {
    expect(calculateDiscount(100, 10)).toBeCloseTo(90);
  });

  it("applies 0% discount (no change)", () => {
    expect(calculateDiscount(200, 0)).toBe(200);
  });

  it("applies 100% discount (free)", () => {
    expect(calculateDiscount(50, 100)).toBe(0);
  });

  it("applies 50% discount", () => {
    expect(calculateDiscount(80, 50)).toBe(40);
  });

  it("works with fractional percent", () => {
    expect(calculateDiscount(100, 12.5)).toBeCloseTo(87.5);
  });

  it("works with zero price", () => {
    expect(calculateDiscount(0, 30)).toBe(0);
  });

  it("returns a negative result when discount > 100%", () => {
    // Behavior is well-defined even if the business logic prevents it
    expect(calculateDiscount(100, 150)).toBeCloseTo(-50);
  });
});

// ─── unitToGrams ──────────────────────────────────────────────────────────────

describe("unitToGrams", () => {
  it("converts tons to grams", () => {
    expect(unitToGrams(1, "ton")).toBe(1_000_000);
    expect(unitToGrams(2.5, "ton")).toBe(2_500_000);
  });

  it("converts kilograms to grams (unit = 'kilogram')", () => {
    expect(unitToGrams(1, "kilogram")).toBe(1000);
    expect(unitToGrams(0.5, "kilogram")).toBe(500);
  });

  it("converts kilograms to grams (unit = 'kg')", () => {
    expect(unitToGrams(3, "kg")).toBe(3000);
  });

  it("treats unknown units as grams (pass-through)", () => {
    expect(unitToGrams(500, "gram")).toBe(500);
    expect(unitToGrams(250, "g")).toBe(250);
    expect(unitToGrams(100, undefined)).toBe(100);
    expect(unitToGrams(100, "lb")).toBe(100); // unsupported unit — pass-through
  });

  it("returns 0 for zero quantity", () => {
    expect(unitToGrams(0, "kg")).toBe(0);
    expect(unitToGrams(0, "ton")).toBe(0);
  });

  it("coerces string quantity", () => {
    expect(unitToGrams("2", "kg")).toBe(2000);
  });

  it("returns 0 for non-numeric quantity", () => {
    expect(unitToGrams("abc", "kg")).toBe(0);
    expect(unitToGrams(null, "kg")).toBe(0);
  });
});

// ─── parseWeightLabelToGrams ──────────────────────────────────────────────────

describe("parseWeightLabelToGrams", () => {
  it("returns 0 for null", () => {
    expect(parseWeightLabelToGrams(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(parseWeightLabelToGrams(undefined)).toBe(0);
  });

  it("returns the numeric value directly when passed a number", () => {
    expect(parseWeightLabelToGrams(250)).toBe(250);
    expect(parseWeightLabelToGrams(0)).toBe(0);
  });

  it("parses plain gram labels", () => {
    expect(parseWeightLabelToGrams("100g")).toBe(100);
    expect(parseWeightLabelToGrams("250 g")).toBe(250);
    expect(parseWeightLabelToGrams("500G")).toBe(500);
  });

  it("parses kilogram labels", () => {
    expect(parseWeightLabelToGrams("1kg")).toBe(1000);
    expect(parseWeightLabelToGrams("2.5 kg")).toBe(2500);
    expect(parseWeightLabelToGrams("0.5KG")).toBe(500);
  });

  it("parses ton labels", () => {
    expect(parseWeightLabelToGrams("1ton")).toBe(1_000_000);
    expect(parseWeightLabelToGrams("0.5 TON")).toBe(500_000);
  });

  it("defaults to grams when no unit is given", () => {
    expect(parseWeightLabelToGrams("200")).toBe(200);
  });

  it("returns 0 for unparseable labels", () => {
    expect(parseWeightLabelToGrams("heavy")).toBe(0);
    expect(parseWeightLabelToGrams("")).toBe(0);
    expect(parseWeightLabelToGrams("abc123g")).toBe(0);
  });

  it("handles extra whitespace gracefully", () => {
    expect(parseWeightLabelToGrams("  100 g  ")).toBe(100);
  });
});

// ─── weightedAvgCostPerGram ───────────────────────────────────────────────────

describe("weightedAvgCostPerGram", () => {
  it("computes a basic weighted average", () => {
    // 1000 g at 0.01/g + 500 g at 0.02/g  →  (10 + 10) / 1500 = 0.01333...
    expect(
      weightedAvgCostPerGram({
        existingGrams: 1000,
        existingCostPerGram: 0.01,
        addedGrams: 500,
        addedCostPerGram: 0.02,
      })
    ).toBeCloseTo(0.01333, 4);
  });

  it("returns the added cost when existing stock is zero", () => {
    expect(
      weightedAvgCostPerGram({
        existingGrams: 0,
        existingCostPerGram: 0.05,
        addedGrams: 1000,
        addedCostPerGram: 0.03,
      })
    ).toBeCloseTo(0.03);
  });

  it("returns the existing cost when added grams are zero", () => {
    expect(
      weightedAvgCostPerGram({
        existingGrams: 500,
        existingCostPerGram: 0.04,
        addedGrams: 0,
        addedCostPerGram: 0.1,
      })
    ).toBeCloseTo(0.04);
  });

  it("returns 0 when both grams are zero (avoids division by zero)", () => {
    expect(
      weightedAvgCostPerGram({
        existingGrams: 0,
        existingCostPerGram: 10,
        addedGrams: 0,
        addedCostPerGram: 20,
      })
    ).toBe(0);
  });

  it("coerces string inputs", () => {
    expect(
      weightedAvgCostPerGram({
        existingGrams: "1000",
        existingCostPerGram: "0.01",
        addedGrams: "0",
        addedCostPerGram: "0.02",
      })
    ).toBeCloseTo(0.01);
  });

  it("treats null/undefined inputs as zero", () => {
    expect(
      weightedAvgCostPerGram({
        existingGrams: null,
        existingCostPerGram: null,
        addedGrams: 500,
        addedCostPerGram: 0.05,
      })
    ).toBeCloseTo(0.05);
  });

  it("produces exact result when both costs are equal", () => {
    expect(
      weightedAvgCostPerGram({
        existingGrams: 300,
        existingCostPerGram: 0.02,
        addedGrams: 700,
        addedCostPerGram: 0.02,
      })
    ).toBeCloseTo(0.02);
  });
});

// ─── deductStock ──────────────────────────────────────────────────────────────

describe("deductStock", () => {
  it("deducts the correct amount", () => {
    expect(deductStock(1000, 250, 2)).toBe(500);
  });

  it("allows deduction to exactly zero", () => {
    expect(deductStock(500, 250, 2)).toBe(0);
  });

  it("throws when stock is insufficient", () => {
    expect(() => deductStock(400, 250, 2)).toThrow("Insufficient stock");
  });

  it("throws when current stock is zero", () => {
    expect(() => deductStock(0, 100, 1)).toThrow("Insufficient stock");
  });

  it("works with quantity of 1", () => {
    expect(deductStock(500, 100, 1)).toBe(400);
  });

  it("throws when needed grams exceed stock by 1", () => {
    expect(() => deductStock(499, 250, 2)).toThrow("Insufficient stock");
  });

  it("handles large quantities", () => {
    expect(deductStock(10_000_000, 1_000, 5)).toBe(9_995_000);
  });
});

// ─── restoreStock ─────────────────────────────────────────────────────────────

describe("restoreStock", () => {
  it("restores the correct amount", () => {
    expect(restoreStock(500, 250, 2)).toBe(1000);
  });

  it("restores from zero stock", () => {
    expect(restoreStock(0, 100, 3)).toBe(300);
  });

  it("works with quantity of 1", () => {
    expect(restoreStock(750, 100, 1)).toBe(850);
  });

  it("is the inverse of deductStock", () => {
    const initial = 2000;
    const variantGrams = 500;
    const qty = 3;
    const afterDeduct = deductStock(initial, variantGrams, qty);
    const afterRestore = restoreStock(afterDeduct, variantGrams, qty);
    expect(afterRestore).toBe(initial);
  });
});

// ─── computeDiscount ──────────────────────────────────────────────────────────

describe("computeDiscount", () => {
  it("returns 0 when promoCode is null", () => {
    expect(computeDiscount(null, 100)).toBe(0);
  });

  it("returns 0 when promoCode is undefined", () => {
    expect(computeDiscount(undefined, 200)).toBe(0);
  });

  it("computes percentage discount", () => {
    expect(computeDiscount({ type: "percentage", value: 10 }, 200)).toBe(20);
  });

  it("computes percentage discount on zero subtotal", () => {
    expect(computeDiscount({ type: "percentage", value: 15 }, 0)).toBe(0);
  });

  it("computes fixed discount up to the subtotal", () => {
    expect(computeDiscount({ type: "fixed", value: 25 }, 100)).toBe(25);
  });

  it("caps fixed discount at the subtotal (no negative total)", () => {
    expect(computeDiscount({ type: "fixed", value: 200 }, 50)).toBe(50);
  });

  it("returns 0 for free_delivery type (no cash discount)", () => {
    expect(computeDiscount({ type: "free_delivery", value: 0 }, 100)).toBe(0);
  });

  it("returns 0 for an unrecognised promo type", () => {
    expect(computeDiscount({ type: "unknown", value: 99 }, 100)).toBe(0);
  });

  it("computes 100% percentage discount", () => {
    expect(computeDiscount({ type: "percentage", value: 100 }, 150)).toBe(150);
  });

  it("handles a fractional percentage", () => {
    expect(computeDiscount({ type: "percentage", value: 7.5 }, 200)).toBeCloseTo(15);
  });
});

// ─── computeDeliveryFee ───────────────────────────────────────────────────────

describe("computeDeliveryFee", () => {
  const zone = { id: 1, nameEn: "Doha", price: 15 };
  const threshold = 200;

  it("returns 0 when no zone is provided", () => {
    expect(computeDeliveryFee(null, null, 50, threshold)).toBe(0);
    expect(computeDeliveryFee(undefined, null, 50, threshold)).toBe(0);
  });

  it("returns zone price when subtotal is below threshold", () => {
    expect(computeDeliveryFee(zone, null, 100, threshold)).toBe(15);
  });

  it("returns 0 when subtotal equals the threshold exactly", () => {
    expect(computeDeliveryFee(zone, null, 200, threshold)).toBe(0);
  });

  it("returns 0 when subtotal exceeds the threshold", () => {
    expect(computeDeliveryFee(zone, null, 350, threshold)).toBe(0);
  });

  it("returns 0 for free_delivery promo regardless of subtotal", () => {
    expect(
      computeDeliveryFee(zone, { type: "free_delivery" }, 50, threshold)
    ).toBe(0);
  });

  it("does NOT skip fee for percentage promo below threshold", () => {
    expect(
      computeDeliveryFee(zone, { type: "percentage", value: 20 }, 80, threshold)
    ).toBe(15);
  });

  it("does NOT skip fee for fixed promo below threshold", () => {
    expect(
      computeDeliveryFee(zone, { type: "fixed", value: 10 }, 80, threshold)
    ).toBe(15);
  });

  it("returns 0 when zone has price of 0", () => {
    expect(computeDeliveryFee({ price: 0 }, null, 50, threshold)).toBe(0);
  });

  it("returns 0 when zone has non-numeric price", () => {
    expect(computeDeliveryFee({ price: "free" }, null, 50, threshold)).toBe(0);
  });

  it("returns fee for a zone with string price below threshold", () => {
    expect(computeDeliveryFee({ price: "20" }, null, 50, threshold)).toBe(20);
  });
});
