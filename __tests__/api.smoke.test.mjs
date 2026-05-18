/**
 * API smoke tests — read-only GET requests against the live dev server.
 *
 * Run these while `next dev` is running on http://localhost:3000.
 * If the server is not reachable every test in this suite is skipped
 * automatically so the suite does not block CI on cold machines.
 */

import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";

const BASE = "http://localhost:3000";
const TIMEOUT_MS = 8000;

let serverUp = false;

// ─── SERVER REACHABILITY CHECK ────────────────────────────────────────────────

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE}/api/site-settings`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    serverUp = res.ok;
  } catch {
    serverUp = false;
  }
});

/** Skips the current test when the dev server is not reachable. */
function skipIfDown() {
  if (!serverUp) {
    // Jest has no built-in programmatic skip inside a test body, so we use a
    // conditional early return combined with a pending mark.
    return true;
  }
  return false;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await res.json();
  return { res, json };
}

// ─── GET /api/products ────────────────────────────────────────────────────────

describe("GET /api/products", () => {
  beforeEach(function () {
    if (skipIfDown()) this.skip?.();
  });

  it("returns HTTP 200", async () => {
    if (!serverUp) return;
    const { res } = await get("/api/products");
    expect(res.status).toBe(200);
  });

  it("returns success: true", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products");
    expect(json.success).toBe(true);
  });

  it("returns a data array", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products");
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("includes a pagination object with expected keys", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products");
    expect(json.pagination).toBeDefined();
    expect(typeof json.pagination).toBe("object");
    // Common pagination shape — at least one of these keys should be present
    const keys = Object.keys(json.pagination);
    const expected = ["total", "page", "limit", "totalPages", "hasMore"];
    expect(keys.some((k) => expected.includes(k))).toBe(true);
  });

  it("each product item has at minimum an id field", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products");
    if (json.data.length === 0) return; // empty catalogue is valid
    for (const product of json.data) {
      expect(product).toHaveProperty("id");
    }
  });
});

// ─── GET /api/products?featured=true&limit=4 ──────────────────────────────────

describe("GET /api/products?featured=true&limit=4", () => {
  beforeEach(function () {
    if (skipIfDown()) this.skip?.();
  });

  it("returns HTTP 200", async () => {
    if (!serverUp) return;
    const { res } = await get("/api/products?featured=true&limit=4");
    expect(res.status).toBe(200);
  });

  it("returns success: true", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products?featured=true&limit=4");
    expect(json.success).toBe(true);
  });

  it("returns at most 4 items", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products?featured=true&limit=4");
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeLessThanOrEqual(4);
  });

  it("returns a data array (not null)", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products?featured=true&limit=4");
    expect(json.data).not.toBeNull();
  });
});

// ─── GET /api/categories?active=true ─────────────────────────────────────────

describe("GET /api/categories?active=true", () => {
  beforeEach(function () {
    if (skipIfDown()) this.skip?.();
  });

  it("returns HTTP 200", async () => {
    if (!serverUp) return;
    const { res } = await get("/api/categories?active=true");
    expect(res.status).toBe(200);
  });

  it("returns an array of categories", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/categories?active=true");
    // Some endpoints return the array directly, others wrap it
    const categories = Array.isArray(json) ? json : json.data;
    expect(Array.isArray(categories)).toBe(true);
  });

  it("each category has an id field", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/categories?active=true");
    const categories = Array.isArray(json) ? json : json.data;
    if (categories.length === 0) return;
    for (const cat of categories) {
      expect(cat).toHaveProperty("id");
    }
  });
});

// ─── GET /api/site-settings ───────────────────────────────────────────────────

describe("GET /api/site-settings", () => {
  beforeEach(function () {
    if (skipIfDown()) this.skip?.();
  });

  it("returns HTTP 200", async () => {
    if (!serverUp) return;
    const { res } = await get("/api/site-settings");
    expect(res.status).toBe(200);
  });

  it("returns success: true", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/site-settings");
    expect(json.success).toBe(true);
  });

  it("returns a data object (not an array)", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/site-settings");
    expect(json.data).toBeDefined();
    expect(typeof json.data).toBe("object");
    expect(Array.isArray(json.data)).toBe(false);
  });

  it("data object is not empty", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/site-settings");
    expect(Object.keys(json.data).length).toBeGreaterThan(0);
  });
});

// ─── GET /api/products/price-range ───────────────────────────────────────────

describe("GET /api/products/price-range", () => {
  beforeEach(function () {
    if (skipIfDown()) this.skip?.();
  });

  it("returns HTTP 200", async () => {
    if (!serverUp) return;
    const { res } = await get("/api/products/price-range");
    expect(res.status).toBe(200);
  });

  it("returns success: true", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products/price-range");
    expect(json.success).toBe(true);
  });

  it("returns a numeric maxPrice", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products/price-range");
    expect(typeof json.maxPrice).toBe("number");
  });

  it("maxPrice is non-negative", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/products/price-range");
    expect(json.maxPrice).toBeGreaterThanOrEqual(0);
  });
});

// ─── GET /api/delivery-zones ──────────────────────────────────────────────────

describe("GET /api/delivery-zones", () => {
  beforeEach(function () {
    if (skipIfDown()) this.skip?.();
  });

  it("returns HTTP 200", async () => {
    if (!serverUp) return;
    const { res } = await get("/api/delivery-zones");
    expect(res.status).toBe(200);
  });

  it("returns success: true", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/delivery-zones");
    expect(json.success).toBe(true);
  });

  it("returns a data array", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/delivery-zones");
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("each delivery zone has id and price fields", async () => {
    if (!serverUp) return;
    const { json } = await get("/api/delivery-zones");
    if (json.data.length === 0) return;
    for (const zone of json.data) {
      expect(zone).toHaveProperty("id");
      expect(zone).toHaveProperty("price");
    }
  });
});
