"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

const toSlug = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const parseWeightToGrams = (weightLabel) => {
  const s = String(weightLabel || "").trim().toLowerCase();
  if (!s) return 0;
  const m = s.match(/^(\d+(\.\d+)?)\s*(g|kg)$/);
  if (!m) return 0;
  const n = Number(m[1]) || 0;
  return m[3] === "kg" ? n * 1000 : n;
};

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [form, setForm] = useState({
    type: "single",
    slug: "",
    categoryId: "",
    stockId: "",
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    price: "",
    originalPrice: "",
    images: [],
    featured: false,
    bestSeller: false,
    active: true,
    labels: { isNew: false, isHot: false, isSale: false, salePercent: 0, isLimited: false },
  });

  // variants: { weightLabel, grams, price }
  const [variants, setVariants] = useState([{ weightLabel: "100g", grams: 100, price: "" }]);
  const [bundleItems, setBundleItems] = useState([{ stockId: "", gramsPerUnit: "" }]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const [catRes, stockRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/admin/stock", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const catData = await catRes.json();
        const stockData = await stockRes.json();
        if (catData.success) setCategories(catData.data);
        if (stockData.success) setStocks(stockData.data.filter((s) => s.active));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const selectedStock = useMemo(
    () => stocks.find((s) => s.id === Number(form.stockId)),
    [stocks, form.stockId]
  );

  const stockMarkup = Number(selectedStock?.pricingRule?.markupPercent ?? 30);
  const stockCostPerGram = Number(selectedStock?.costPerGram || 0);

  const suggestPrice = useCallback(
    (grams) => {
      if (!stockCostPerGram || !grams) return "";
      return (stockCostPerGram * grams * (1 + stockMarkup / 100)).toFixed(2);
    },
    [stockCostPerGram, stockMarkup]
  );

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const handleLabelChange = (field, value) =>
    setForm((p) => ({ ...p, labels: { ...p.labels, [field]: value } }));

  const handleVariantChange = (i, field, value) => {
    setVariants((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === "weightLabel") {
        const g = parseWeightToGrams(value);
        next[i].grams = g;
        if (!next[i].price && g && stockCostPerGram) {
          next[i].price = suggestPrice(g);
        }
      }
      if (field === "grams" && !next[i].price && stockCostPerGram) {
        next[i].price = suggestPrice(Number(value));
      }
      return next;
    });
  };
  const addVariant = () => {
    setVariants((prev) => [...prev, { weightLabel: "", grams: 0, price: "" }]);
  };
  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const handleBundleItemChange = (i, field, value) => {
    setBundleItems((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next; });
  };
  const addBundleItem = () => setBundleItems((prev) => [...prev, { stockId: "", gramsPerUnit: "" }]);
  const removeBundleItem = (i) => setBundleItems((prev) => prev.filter((_, idx) => idx !== i));

  const bundleCost = useMemo(() => {
    return bundleItems.reduce((sum, item) => {
      const st = stocks.find((s) => s.id === Number(item.stockId));
      const g = Number(item.gramsPerUnit) || 0;
      const c = Number(st?.costPerGram || 0);
      return sum + g * c;
    }, 0);
  }, [bundleItems, stocks]);

  const bundleDefaultMarkup = 30;
  const bundleSuggestedPrice = bundleCost > 0
    ? (bundleCost * (1 + bundleDefaultMarkup / 100)).toFixed(2)
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("adminToken");
      const salePct = form.labels.isSale
        ? Math.max(0, Math.min(99, Number(form.labels.salePercent) || 0))
        : 0;

      if (!form.slug || !form.categoryId) {
        setError("Slug and category are required.");
        setLoading(false);
        return;
      }

      let payload;
      if (form.type === "single") {
        if (!form.stockId) {
          setError("Please select a stock item.");
          setLoading(false);
          return;
        }
        const cleanVariants = variants
          .map((v) => ({
            weightLabel: String(v.weightLabel || "").trim(),
            grams: Number(v.grams) || parseWeightToGrams(v.weightLabel),
            price: Number(v.price) || 0,
          }))
          .filter((v) => v.weightLabel && v.grams > 0 && v.price > 0);

        if (!cleanVariants.length) {
          setError("Add at least one valid variant with label, grams, and price > 0.");
          setLoading(false);
          return;
        }

        payload = {
          type: "single",
          slug: form.slug,
          categoryId: Number(form.categoryId),
          stockId: Number(form.stockId),
          variants: cleanVariants,
          images: form.images,
          labels: { ...form.labels, salePercent: salePct },
          featured: form.featured,
          bestSeller: form.bestSeller,
          active: form.active,
        };
      } else {
        const cleanBundleItems = bundleItems
          .map((b) => ({ stockId: Number(b.stockId), gramsPerUnit: Number(b.gramsPerUnit) }))
          .filter((b) => b.stockId > 0 && b.gramsPerUnit > 0);

        if (!cleanBundleItems.length) {
          setError("Bundle must include at least one valid stock item.");
          setLoading(false);
          return;
        }
        if (!Number(form.price) || Number(form.price) <= 0) {
          setError("Bundle price is required.");
          setLoading(false);
          return;
        }

        payload = {
          type: "bundle",
          slug: form.slug,
          categoryId: Number(form.categoryId),
          nameEn: form.nameEn || "Bundle Product",
          nameAr: form.nameAr || "منتج باقة",
          descriptionEn: form.descriptionEn || "",
          descriptionAr: form.descriptionAr || "",
          images: form.images,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          bundleItems: cleanBundleItems,
          labels: { ...form.labels, salePercent: salePct },
          featured: form.featured,
          bestSeller: form.bestSeller,
          active: form.active,
        };
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("Product created successfully!");
        setTimeout(() => router.push("/admin/products"), 1000);
      } else {
        setError(data.message || "Failed to create product");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Add New Product</h2>
          <p className="text-stone-500 text-sm mt-1">
            Single products are created from Stock. Bundles combine multiple stock items.
          </p>
        </div>
        <Link href="/admin/products" className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-sm">
          ← Back to Products
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-semibold text-sm">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-semibold text-sm">
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* CORE SETUP */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
          <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-3">Core Product Setup</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
              >
                <option value="single">Single (from Stock)</option>
                <option value="bundle">Bundle (multi-stock)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-mono"
                required
              />
            </div>
          </div>

          {form.type === "single" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Stock Source *</label>
                <select
                  value={form.stockId}
                  onChange={(e) => {
                    const stockId = e.target.value;
                    const stock = stocks.find((s) => s.id === Number(stockId));
                    setForm((p) => ({
                      ...p,
                      stockId,
                      slug: stock?.nameEn ? toSlug(stock.nameEn) : p.slug,
                    }));
                    // Re-suggest prices for existing variants
                    if (stock) {
                      const cpg = Number(stock.costPerGram) || 0;
                      const markup = Number(stock.pricingRule?.markupPercent ?? 30);
                      setVariants((prev) =>
                        prev.map((v) => ({
                          ...v,
                          price: v.grams && cpg
                            ? String((cpg * v.grams * (1 + markup / 100)).toFixed(2))
                            : v.price,
                        }))
                      );
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                >
                  <option value="">Select Stock</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn} ({Number(s.currentStockGrams || 0).toFixed(0)}g)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-400 mt-1">Name/description are auto-copied from selected stock.</p>
              </div>
              {selectedStock && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm">
                  <p className="font-bold text-stone-700">Stock info</p>
                  <p className="text-stone-600">Cost/g: <b>{Number(selectedStock.costPerGram).toFixed(4)} QAR</b></p>
                  <p className="text-stone-600">Saved markup: <b>{stockMarkup.toFixed(1)}%</b></p>
                </div>
              )}
            </div>
          )}

          {form.type === "bundle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Name (English) *</label>
                <input
                  value={form.nameEn}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((p) => ({ ...p, nameEn: v, slug: toSlug(v) }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Name (Arabic) *</label>
                <input
                  value={form.nameAr}
                  onChange={(e) => handleChange("nameAr", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-right"
                  dir="rtl"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* SINGLE VARIANTS */}
        {form.type === "single" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-800 text-lg">Variants & Prices</h3>
              <button type="button" onClick={addVariant} className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold">
                + Add Variant
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-bold text-stone-500 uppercase px-1">
              <span>Label</span>
              <span>Grams</span>
              <span>Price (QAR)</span>
              <span>Margin</span>
            </div>
            {variants.map((v, i) => {
              const grams = Number(v.grams) || 0;
              const price = Number(v.price) || 0;
              const variantCost = stockCostPerGram * grams;
              const margin = price > 0 && variantCost > 0
                ? (((price - variantCost) / variantCost) * 100).toFixed(1)
                : null;
              const suggested = suggestPrice(grams);
              const belowCost = price > 0 && variantCost > 0 && price < variantCost;
              return (
                <div key={i} className="grid grid-cols-4 gap-2 items-start">
                  <div>
                    <input
                      type="text"
                      value={v.weightLabel}
                      onChange={(e) => handleVariantChange(i, "weightLabel", e.target.value)}
                      placeholder="100g / 250g"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={v.grams}
                      onChange={(e) => handleVariantChange(i, "grams", Number(e.target.value))}
                      placeholder="grams"
                      min="1"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => handleVariantChange(i, "price", e.target.value)}
                        placeholder={suggested || "0.00"}
                        min="0"
                        step="0.01"
                        className={`w-full px-3 py-2 rounded-xl border text-sm ${belowCost ? "border-red-400 bg-red-50" : "border-stone-200"}`}
                      />
                    </div>
                    {suggested && !v.price && (
                      <button
                        type="button"
                        onClick={() => handleVariantChange(i, "price", suggested)}
                        className="text-xs text-amber-700 font-semibold mt-0.5 hover:underline"
                      >
                        Use suggest: {suggested}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {margin !== null && (
                      <span className={`text-xs font-bold ${belowCost ? "text-red-600" : Number(margin) < 10 ? "text-orange-500" : "text-green-600"}`}>
                        {belowCost ? "⚠ below cost" : `${margin}% markup`}
                      </span>
                    )}
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(i)} className="ml-auto p-1 text-red-400 hover:bg-red-50 rounded-lg text-xs">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BUNDLE CONTENTS */}
        {form.type === "bundle" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-800 text-lg">Bundle Contents</h3>
              <button type="button" onClick={addBundleItem} className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold">
                + Add Item
              </button>
            </div>

            {bundleItems.map((b, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <select
                  value={b.stockId}
                  onChange={(e) => handleBundleItemChange(i, "stockId", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                >
                  <option value="">Select Stock</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>{s.nameEn}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={b.gramsPerUnit}
                  onChange={(e) => handleBundleItemChange(i, "gramsPerUnit", e.target.value)}
                  placeholder="grams per bundle"
                  min="1"
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
                <div className="text-xs text-stone-500">
                  Cost: <b>{((Number(b.gramsPerUnit) || 0) * Number(stocks.find((s) => s.id === Number(b.stockId))?.costPerGram || 0)).toFixed(2)} QAR</b>
                </div>
                {bundleItems.length > 1 ? (
                  <button type="button" onClick={() => removeBundleItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">✕</button>
                ) : <div />}
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Bundle Price (QAR) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
                {bundleSuggestedPrice && !form.price && (
                  <button
                    type="button"
                    onClick={() => handleChange("price", bundleSuggestedPrice)}
                    className="text-xs text-amber-700 font-semibold mt-1 hover:underline"
                  >
                    Use suggest: {bundleSuggestedPrice}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Original Price (QAR)</label>
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => handleChange("originalPrice", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm">
                <p className="font-bold text-stone-700">Bundle cost</p>
                <p className="text-stone-600">{bundleCost.toFixed(2)} QAR</p>
                {form.price && Number(form.price) > 0 && bundleCost > 0 && (
                  <p className={`text-xs font-bold mt-1 ${Number(form.price) < bundleCost ? "text-red-600" : "text-green-600"}`}>
                    Markup: {(((Number(form.price) - bundleCost) / bundleCost) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* IMAGES */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
          <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-3">Images</h3>
          <ImageUpload
            images={form.images}
            onChange={(urls) => handleChange("images", urls)}
          />
        </div>

        {/* LABELS */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
          <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-3">Labels & Flags</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "featured", label: "⭐ Featured", checked: form.featured, onChange: (v) => handleChange("featured", v) },
              { key: "bestSeller", label: "🔥 Best Seller", checked: form.bestSeller, onChange: (v) => handleChange("bestSeller", v) },
              { key: "active", label: "✅ Active", checked: form.active, onChange: (v) => handleChange("active", v) },
              { key: "isNew", label: "🆕 New", checked: form.labels.isNew, onChange: (v) => handleLabelChange("isNew", v) },
              { key: "isHot", label: "🌶️ Hot", checked: form.labels.isHot, onChange: (v) => handleLabelChange("isHot", v) },
              { key: "isSale", label: "💰 Sale", checked: form.labels.isSale, onChange: (v) => handleLabelChange("isSale", v) },
              { key: "isLimited", label: "⏳ Limited", checked: form.labels.isLimited, onChange: (v) => handleLabelChange("isLimited", v) },
            ].map((item) => (
              <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${item.checked ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}>
                <input type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} className="w-4 h-4 accent-amber-700" />
                <span className="text-sm font-semibold text-stone-700">{item.label}</span>
              </label>
            ))}
          </div>

          {form.labels.isSale && (
            <div className="mt-2 p-4 rounded-xl bg-rose-50 border-2 border-rose-200 flex flex-col gap-2">
              <label className="block text-sm font-bold text-rose-700">💰 Sale Percentage (%) *</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  value={form.labels.salePercent || ""}
                  onChange={(e) => handleLabelChange("salePercent", Number(e.target.value))}
                  className="max-w-[140px] px-4 py-2.5 rounded-xl border border-rose-200 text-sm"
                />
                <span className="text-sm font-semibold text-rose-700">% OFF</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/admin/products" className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "✅ Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
