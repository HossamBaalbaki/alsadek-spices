"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

const LABEL_KEYS = ["isNew", "isHot", "isSale", "isLimited"];

export default function NewStockPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [allStocks, setAllStocks] = useState([]); // for bundle picker
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    images: [],
    categoryId: "",
    type: "single",
    active: true,
    featured: false,
    bestSeller: false,
    currentStockPcs: "",
    lowStockThresholdPcs: "5",
    // single
    variants: [{ label: "", grams: "", price: "" }],
    // labels
    labels: { isNew: false, isHot: false, isSale: false, salePercent: "", isLimited: false },
    // bundle
    price: "",
    bundleItems: [], // [{ stockId, quantity }]
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/admin/stock?type=single", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([cats, stocks]) => {
      if (cats.success) setCategories(cats.data);
      if (stocks.success) setAllStocks(stocks.data);
    });
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setLabel = (key, val) => setForm((f) => ({ ...f, labels: { ...f.labels, [key]: val } }));

  // ─── Variant helpers ───
  const setVariant = (i, key, val) =>
    setForm((f) => {
      const v = [...f.variants];
      v[i] = { ...v[i], [key]: val };
      return { ...f, variants: v };
    });
  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { label: "", grams: "", price: "" }] }));
  const removeVariant = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  // ─── Bundle item helpers ───
  const addBundleItem = (stockId) => {
    if (!stockId || form.bundleItems.find((b) => b.stockId === Number(stockId))) return;
    setForm((f) => ({ ...f, bundleItems: [...f.bundleItems, { stockId: Number(stockId), quantity: 1 }] }));
  };
  const removeBundleItem = (stockId) =>
    setForm((f) => ({ ...f, bundleItems: f.bundleItems.filter((b) => b.stockId !== stockId) }));
  const setBundleQty = (stockId, qty) =>
    setForm((f) => ({
      ...f,
      bundleItems: f.bundleItems.map((b) => (b.stockId === stockId ? { ...b, quantity: Number(qty) } : b)),
    }));

  const bundleSumPrice = form.bundleItems.reduce((sum, b) => {
    const stock = allStocks.find((s) => s.id === b.stockId);
    const price = Number(stock?.variants?.[0]?.price || 0);
    return sum + price * b.quantity;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nameEn || !form.nameAr) return setError("Name in both languages is required.");
    if (form.type === "single" && form.variants.some((v) => !v.label || !Number(v.price))) {
      return setError("All variants need a label and a price.");
    }
    if (form.type === "bundle" && !Number(form.price)) {
      return setError("Bundle needs a selling price.");
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        nameEn: form.nameEn,
        nameAr: form.nameAr,
        descriptionEn: form.descriptionEn,
        descriptionAr: form.descriptionAr,
        images: form.images,
        categoryId: form.categoryId || null,
        type: form.type,
        active: form.active,
        featured: form.featured,
        bestSeller: form.bestSeller,
        currentStockPcs: Number(form.currentStockPcs) || 0,
        lowStockThresholdPcs: Number(form.lowStockThresholdPcs) || 5,
        labels: {
          isNew: form.labels.isNew,
          isHot: form.labels.isHot,
          isSale: form.labels.isSale,
          salePercent: Number(form.labels.salePercent) || 0,
          isLimited: form.labels.isLimited,
        },
      };

      if (form.type === "single") {
        payload.variants = form.variants.map((v) => ({
          label: v.label,
          grams: Number(v.grams) || 0,
          price: Number(v.price),
        }));
      } else {
        payload.price = Number(form.price);
        payload.bundleItems = form.bundleItems;
      }

      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) setError(data.message || "Failed to create");
      else router.push("/admin/stock");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Add Stock Item</h2>
          <p className="text-stone-500 text-sm mt-1">Add a new product to inventory and shop.</p>
        </div>
        <Link href="/admin/stock" className="btn btn-outline">← Back</Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-6">

        {/* TYPE */}
        <div>
          <label className="text-xs font-bold text-stone-600 uppercase">Type</label>
          <div className="flex gap-4 mt-2">
            {["single", "bundle"].map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => set("type", t)} />
                <span className="font-semibold text-stone-700 capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* NAMES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Name (English) *</label>
            <input className="input w-full mt-1" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="e.g. Saffron" />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Name (Arabic) *</label>
            <input className="input w-full mt-1" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} placeholder="مثال: زعفران" dir="rtl" />
          </div>
        </div>

        {/* DESCRIPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Description (English)</label>
            <textarea className="input w-full mt-1 min-h-[80px]" value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Description (Arabic)</label>
            <textarea className="input w-full mt-1 min-h-[80px]" value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} dir="rtl" />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="text-xs font-bold text-stone-600 uppercase">Category</label>
          <select className="input w-full mt-1" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
          </select>
        </div>

        {/* IMAGES */}
        <div>
          <label className="text-xs font-bold text-stone-600 uppercase mb-2 block">Images</label>
          <ImageUpload images={form.images} onChange={(urls) => set("images", urls)} />
        </div>

        {/* ─── SINGLE: VARIANTS ─── */}
        {form.type === "single" && (
          <div className="border-t border-stone-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-stone-800">Variants (Sizes & Prices)</h3>
              <button type="button" onClick={addVariant} className="btn btn-sm btn-outline">+ Add Variant</button>
            </div>
            <div className="flex flex-col gap-3">
              {form.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase">Label *</label>
                    <input className="input w-full mt-1" value={v.label} onChange={(e) => setVariant(i, "label", e.target.value)} placeholder="e.g. 250g" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase">Grams</label>
                    <input type="number" min="0" className="input w-full mt-1" value={v.grams} onChange={(e) => setVariant(i, "grams", e.target.value)} placeholder="e.g. 250" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-stone-500 uppercase">Sell Price (QAR) *</label>
                      <input type="number" min="0" step="0.01" className="input w-full mt-1" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} placeholder="e.g. 25.00" />
                    </div>
                    {form.variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(i)} className="btn btn-sm btn-ghost text-red-500 self-end">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── BUNDLE: ITEMS + PRICE ─── */}
        {form.type === "bundle" && (
          <div className="border-t border-stone-200 pt-6 flex flex-col gap-4">
            <h3 className="text-sm font-black text-stone-800">Bundle Contents</h3>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Add Stock Item to Bundle</label>
              <select className="input w-full mt-1" onChange={(e) => { addBundleItem(e.target.value); e.target.value = ""; }} defaultValue="">
                <option value="">— Select a stock item —</option>
                {allStocks.filter((s) => !form.bundleItems.find((b) => b.stockId === s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.nameEn}</option>
                ))}
              </select>
            </div>

            {form.bundleItems.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.bundleItems.map((b) => {
                  const s = allStocks.find((x) => x.id === b.stockId);
                  return (
                    <div key={b.stockId} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2">
                      <span className="flex-1 font-semibold text-stone-700">{s?.nameEn}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-stone-500">Qty:</label>
                        <input type="number" min="1" className="input w-20" value={b.quantity} onChange={(e) => setBundleQty(b.stockId, e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeBundleItem(b.stockId)} className="text-red-500 font-bold">✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {bundleSumPrice > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-stone-700">
                Items total price: <strong>{bundleSumPrice.toFixed(2)} QAR</strong>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Your Selling Price (QAR) *</label>
                <input type="number" min="0" step="0.01" className="input w-full mt-1" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 80.00" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Original Price (optional)</label>
                <input type="number" min="0" step="0.01" className="input w-full mt-1" value={form.originalPrice || ""} onChange={(e) => set("originalPrice", e.target.value)} placeholder="Before discount" />
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY */}
        <div className="border-t border-stone-200 pt-6">
          <h3 className="text-sm font-black text-stone-800 mb-3">Inventory</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-600 uppercase">Initial Stock (pcs)</label>
              <input type="number" min="0" step="1" className="input w-full mt-1" value={form.currentStockPcs} onChange={(e) => set("currentStockPcs", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 uppercase">Low Stock Alert (pcs)</label>
              <input type="number" min="1" step="1" className="input w-full mt-1" value={form.lowStockThresholdPcs} onChange={(e) => set("lowStockThresholdPcs", e.target.value)} />
              <p className="text-xs text-stone-400 mt-1">Alert shown when stock ≤ this value.</p>
            </div>
          </div>
        </div>

        {/* LABELS */}
        <div className="border-t border-stone-200 pt-6">
          <h3 className="text-sm font-black text-stone-800 mb-3">Labels & Badges</h3>
          <div className="flex flex-wrap gap-4">
            {LABEL_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.labels[k]} onChange={(e) => setLabel(k, e.target.checked)} />
                <span className="text-sm font-semibold text-stone-700 capitalize">{k.replace("is", "")}</span>
              </label>
            ))}
            {form.labels.isSale && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Sale %</label>
                <input type="number" min="1" max="99" className="input w-20" value={form.labels.salePercent} onChange={(e) => setLabel("salePercent", e.target.value)} placeholder="10" />
              </div>
            )}
          </div>
        </div>

        {/* SETTINGS */}
        <div className="border-t border-stone-200 pt-6 flex flex-wrap gap-6">
          {[["active", "Active (visible in shop)"], ["featured", "Featured"], ["bestSeller", "Best Seller"]].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
              <span className="text-sm font-semibold text-stone-700">{label}</span>
            </label>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2 border-t border-stone-200">
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Create Stock Item"}</button>
          <Link href="/admin/stock" className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
