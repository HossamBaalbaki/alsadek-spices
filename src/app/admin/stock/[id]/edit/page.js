"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

const LABEL_KEYS = ["isNew", "isHot", "isSale", "isLimited"];

export default function EditStockPage() {
  const { id } = useParams();
  const router = useRouter();

  const [stock, setStock] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(null);

  const [restock, setRestock] = useState({ addedPcs: "", notes: "" });
  const [restocking, setRestocking] = useState(false);
  const [restockError, setRestockError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const [sRes, cRes, aRes] = await Promise.all([
        fetch(`/api/admin/stock/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/categories"),
        fetch("/api/admin/stock?type=single", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [sData, cData, aData] = await Promise.all([sRes.json(), cRes.json(), aRes.json()]);

      if (sData.success) {
        const s = sData.data;
        setStock(s);
        const labels = s.labels || {};
        setForm({
          nameEn: s.nameEn || "",
          nameAr: s.nameAr || "",
          descriptionEn: s.descriptionEn || "",
          descriptionAr: s.descriptionAr || "",
          images: Array.isArray(s.images) ? s.images : [],
          categoryId: s.categoryId ? String(s.categoryId) : "",
          active: s.active,
          featured: s.featured ?? false,
          bestSeller: s.bestSeller ?? false,
          lowStockThresholdPcs: String(s.lowStockThresholdPcs ?? 5),
          variants: Array.isArray(s.variants) && s.variants.length > 0
            ? s.variants.map((v) => ({ label: v.label || "", grams: String(v.grams || ""), price: String(v.price || "") }))
            : [{ label: "", grams: "", price: "" }],
          labels: {
            isNew: labels.isNew ?? false,
            isHot: labels.isHot ?? false,
            isSale: labels.isSale ?? false,
            salePercent: String(labels.salePercent || ""),
            isLimited: labels.isLimited ?? false,
          },
          price: s.price ? String(s.price) : "",
          originalPrice: s.originalPrice ? String(s.originalPrice) : "",
          bundleItems: Array.isArray(s.bundleContents)
            ? s.bundleContents.map((b) => ({ stockId: b.stockId, quantity: b.quantity || 1 }))
            : [],
        });
      }
      if (cData.success) setCategories(cData.data);
      if (aData.success) setAllStocks(aData.data.filter((s) => s.id !== Number(id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading || !form || !stock) {
    return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-bounce">🧂</div></div>;
  }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setLabel = (key, val) => setForm((f) => ({ ...f, labels: { ...f.labels, [key]: val } }));
  const setVariant = (i, key, val) => setForm((f) => { const v = [...f.variants]; v[i] = { ...v[i], [key]: val }; return { ...f, variants: v }; });
  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { label: "", grams: "", price: "" }] }));
  const removeVariant = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const addBundleItem = (stockId) => {
    if (!stockId || form.bundleItems.find((b) => b.stockId === Number(stockId))) return;
    setForm((f) => ({ ...f, bundleItems: [...f.bundleItems, { stockId: Number(stockId), quantity: 1 }] }));
  };
  const removeBundleItem = (stockId) => setForm((f) => ({ ...f, bundleItems: f.bundleItems.filter((b) => b.stockId !== stockId) }));
  const setBundleQty = (stockId, qty) => setForm((f) => ({ ...f, bundleItems: f.bundleItems.map((b) => b.stockId === stockId ? { ...b, quantity: Number(qty) } : b) }));

  const bundleSumPrice = form.bundleItems.reduce((sum, b) => {
    const s = allStocks.find((x) => x.id === b.stockId);
    return sum + Number(s?.variants?.[0]?.price || 0) * b.quantity;
  }, 0);

  const isEmpty = stock.currentStockPcs <= 0;
  const isLow = !isEmpty && stock.currentStockPcs <= stock.lowStockThresholdPcs;

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.nameEn || !form.nameAr) return setError("Name in both languages is required.");

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        nameEn: form.nameEn, nameAr: form.nameAr,
        descriptionEn: form.descriptionEn, descriptionAr: form.descriptionAr,
        images: form.images,
        categoryId: form.categoryId || null,
        active: form.active, featured: form.featured, bestSeller: form.bestSeller,
        lowStockThresholdPcs: Number(form.lowStockThresholdPcs) || 5,
        labels: { isNew: form.labels.isNew, isHot: form.labels.isHot, isSale: form.labels.isSale, salePercent: Number(form.labels.salePercent) || 0, isLimited: form.labels.isLimited },
      };

      if (stock.type === "single") {
        payload.variants = form.variants.map((v) => ({ label: v.label, grams: Number(v.grams) || 0, price: Number(v.price) }));
      } else {
        payload.price = Number(form.price) || null;
        payload.originalPrice = Number(form.originalPrice) || null;
        payload.bundleItems = form.bundleItems;
      }

      const res = await fetch(`/api/admin/stock/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) setError(data.message || "Update failed");
      else { setSuccess("Saved ✓"); loadAll(); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    setRestockError("");
    const pcs = Number(restock.addedPcs);
    if (!pcs || pcs <= 0 || !Number.isInteger(pcs)) return setRestockError("Enter a whole number of pieces > 0.");
    setRestocking(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/stock/${id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addedPcs: pcs, notes: restock.notes }),
      });
      const data = await res.json();
      if (!data.success) setRestockError(data.message || "Failed");
      else { setRestock({ addedPcs: "", notes: "" }); loadAll(); }
    } catch { setRestockError("Network error"); }
    finally { setRestocking(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this stock item? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/stock/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) { alert(data.message); return; }
      router.push("/admin/stock");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Edit · {stock.nameEn}</h2>
          <p className="text-stone-500 text-sm mt-1">
            Stock: <strong className={isEmpty ? "text-red-700" : isLow ? "text-orange-700" : "text-green-700"}>{stock.currentStockPcs} pcs</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50">Delete</button>
          <Link href="/admin/stock" className="btn btn-outline">← Back</Link>
        </div>
      </div>

      {/* STATUS */}
      <div className={`rounded-2xl border p-4 ${isEmpty ? "bg-red-50 border-red-200" : isLow ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
        <p className="font-bold text-sm">{isEmpty ? "⛔ Out of stock" : isLow ? "⚠ Low stock" : "✓ In stock"}</p>
        <p className="text-xs text-stone-600 mt-0.5">Alert threshold: {stock.lowStockThresholdPcs} pcs</p>
      </div>

      {/* RESTOCK PANEL */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-sm font-black text-stone-800 mb-3">+ Add Restock (Replenish)</h3>
        {restockError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 mb-3">{restockError}</div>}
        <form onSubmit={handleRestock} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Pieces Added *</label>
            <input type="number" min="1" step="1" className="input w-full mt-1" value={restock.addedPcs} onChange={(e) => setRestock((r) => ({ ...r, addedPcs: e.target.value }))} placeholder="e.g. 10" />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Notes (optional)</label>
            <input className="input w-full mt-1" value={restock.notes} onChange={(e) => setRestock((r) => ({ ...r, notes: e.target.value }))} placeholder="e.g. New delivery" />
          </div>
          <button type="submit" disabled={restocking} className="btn btn-primary">{restocking ? "Adding…" : "Add Stock"}</button>
        </form>

        {stock.restocks && stock.restocks.length > 0 && (
          <div className="mt-6 border-t border-stone-200 pt-4">
            <h4 className="text-xs font-bold text-stone-600 uppercase mb-2">Restock History</h4>
            <div className="flex flex-col gap-1">
              {stock.restocks.map((r) => (
                <div key={r.id} className="flex justify-between text-xs text-stone-600 border-b border-stone-100 py-1.5">
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                  <span className="font-semibold">
                    {r.addedPcs > 0 ? `+${r.addedPcs} pcs` : `+${r.addedGrams}g`}
                    {r.notes ? ` — ${r.notes}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN FORM */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-6">
        {/* NAMES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Name (English) *</label>
            <input className="input w-full mt-1" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Name (Arabic) *</label>
            <input className="input w-full mt-1" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} dir="rtl" />
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

        {/* SINGLE: VARIANTS */}
        {stock.type === "single" && (
          <div className="border-t border-stone-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-stone-800">Variants (Sizes & Prices)</h3>
              <button type="button" onClick={addVariant} className="btn btn-sm btn-outline">+ Add</button>
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
                    <input type="number" min="0" className="input w-full mt-1" value={v.grams} onChange={(e) => setVariant(i, "grams", e.target.value)} placeholder="250" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-stone-500 uppercase">Sell Price (QAR) *</label>
                      <input type="number" min="0" step="0.01" className="input w-full mt-1" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} placeholder="25.00" />
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

        {/* BUNDLE: ITEMS + PRICE */}
        {stock.type === "bundle" && (
          <div className="border-t border-stone-200 pt-6 flex flex-col gap-4">
            <h3 className="text-sm font-black text-stone-800">Bundle Contents</h3>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Add Item</label>
              <select className="input w-full mt-1" onChange={(e) => { addBundleItem(e.target.value); e.target.value = ""; }} defaultValue="">
                <option value="">— Select a stock item —</option>
                {allStocks.filter((s) => !form.bundleItems.find((b) => b.stockId === s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.nameEn}</option>
                ))}
              </select>
            </div>
            {form.bundleItems.map((b) => {
              const s = allStocks.find((x) => x.id === b.stockId);
              return (
                <div key={b.stockId} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2">
                  <span className="flex-1 font-semibold text-stone-700">{s?.nameEn || `Stock #${b.stockId}`}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-500">Qty:</label>
                    <input type="number" min="1" className="input w-20" value={b.quantity} onChange={(e) => setBundleQty(b.stockId, e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeBundleItem(b.stockId)} className="text-red-500 font-bold">✕</button>
                </div>
              );
            })}
            {bundleSumPrice > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                Items total: <strong>{bundleSumPrice.toFixed(2)} QAR</strong>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Your Selling Price (QAR)</label>
                <input type="number" min="0" step="0.01" className="input w-full mt-1" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Original Price (optional)</label>
                <input type="number" min="0" step="0.01" className="input w-full mt-1" value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY */}
        <div className="border-t border-stone-200 pt-6">
          <h3 className="text-sm font-black text-stone-800 mb-3">Inventory</h3>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">Low Stock Alert (pcs)</label>
            <input type="number" min="1" step="1" className="input w-48 mt-1" value={form.lowStockThresholdPcs} onChange={(e) => set("lowStockThresholdPcs", e.target.value)} />
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
                <input type="number" min="1" max="99" className="input w-20" value={form.labels.salePercent} onChange={(e) => setLabel("salePercent", e.target.value)} />
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

        <div className="flex gap-3 pt-2 border-t border-stone-200">
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Save Changes"}</button>
          <Link href="/admin/stock" className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
