"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const UNITS = [
  { value: "gram", label: "Gram (g)" },
  { value: "kilogram", label: "Kilogram (kg)" },
  { value: "ton", label: "Ton" },
];

const unitToGrams = (q, u) => {
  const n = Number(q) || 0;
  if (u === "ton") return n * 1_000_000;
  if (u === "kilogram") return n * 1000;
  return n;
};

export default function NewStockPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    images: [""],
    categoryId: "",
    purchaseUnit: "kilogram",
    purchaseQuantity: "",
    purchasePrice: "",
    sellPricePerGram: "",
    lowStockThresholdGrams: "500",
    active: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setImage = (i, val) => {
    setForm((f) => {
      const next = [...f.images];
      next[i] = val;
      return { ...f, images: next };
    });
  };
  const addImage = () =>
    setForm((f) => ({ ...f, images: [...f.images, ""] }));
  const removeImage = (i) =>
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, idx) => idx !== i),
    }));

  const totalGrams = unitToGrams(form.purchaseQuantity, form.purchaseUnit);
  const costPerGram =
    totalGrams > 0 ? Number(form.purchasePrice) / totalGrams : 0;
  const sellPerGram = Number(form.sellPricePerGram) || 0;
  const marginPct =
    sellPerGram > 0 && costPerGram > 0
      ? ((sellPerGram - costPerGram) / sellPerGram) * 100
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nameEn || !form.nameAr) {
      setError("Please enter name in both languages.");
      return;
    }
    if (!Number(form.purchaseQuantity) || Number(form.purchaseQuantity) <= 0) {
      setError("Purchase quantity must be > 0.");
      return;
    }
    if (!Number(form.purchasePrice) || Number(form.purchasePrice) <= 0) {
      setError("Purchase price must be > 0.");
      return;
    }
    if (!Number(form.sellPricePerGram) || Number(form.sellPricePerGram) <= 0) {
      setError("Sell price per gram must be > 0.");
      return;
    }
    if (sellPerGram < costPerGram) {
      setError(
        `Sell price per gram cannot be below cost per gram (${costPerGram.toFixed(
          4
        )}).`
      );
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        nameEn: form.nameEn,
        nameAr: form.nameAr,
        descriptionEn: form.descriptionEn,
        descriptionAr: form.descriptionAr,
        images: form.images.filter((u) => u && u.trim()),
        categoryId: form.categoryId || null,
        purchaseUnit: form.purchaseUnit,
        purchaseQuantity: Number(form.purchaseQuantity),
        purchasePrice: Number(form.purchasePrice),
        sellPricePerGram: Number(form.sellPricePerGram),
        lowStockThresholdGrams: Number(form.lowStockThresholdGrams) || 500,
        active: form.active,
      };
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Failed to create stock");
      } else {
        router.push("/admin/stock");
      }
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Add Stock</h2>
          <p className="text-stone-500 text-sm mt-1">
            Record a new purchase of a product for your inventory.
          </p>
        </div>
        <Link href="/admin/stock" className="btn btn-outline">
          ← Back
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-6"
      >
        {/* NAMES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">
              Name (English) *
            </label>
            <input
              className="input w-full mt-1"
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              placeholder="e.g. Saffron"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">
              Name (Arabic) *
            </label>
            <input
              className="input w-full mt-1"
              value={form.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              placeholder="مثال: زعفران"
              dir="rtl"
            />
          </div>
        </div>

        {/* DESCRIPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">
              Description (English)
            </label>
            <textarea
              className="input w-full mt-1 min-h-[80px]"
              value={form.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">
              Description (Arabic)
            </label>
            <textarea
              className="input w-full mt-1 min-h-[80px]"
              value={form.descriptionAr}
              onChange={(e) => set("descriptionAr", e.target.value)}
              dir="rtl"
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="text-xs font-bold text-stone-600 uppercase">
            Category (optional)
          </label>
          <select
            className="input w-full mt-1"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* IMAGES */}
        <div>
          <label className="text-xs font-bold text-stone-600 uppercase">
            Image URLs
          </label>
          <div className="flex flex-col gap-2 mt-2">
            {form.images.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => setImage(i, e.target.value)}
                />
                {form.images.length > 1 && (
                  <button
                    type="button"
                    className="px-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold"
                    onClick={() => removeImage(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImage}
              className="self-start text-sm font-bold text-amber-700 hover:text-amber-900"
            >
              + Add image
            </button>
          </div>
        </div>

        {/* PURCHASE */}
        <div className="border-t border-stone-200 pt-6">
          <h3 className="text-sm font-black text-stone-800 mb-3">
            Initial Purchase
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-600 uppercase">
                Unit *
              </label>
              <select
                className="input w-full mt-1"
                value={form.purchaseUnit}
                onChange={(e) => set("purchaseUnit", e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 uppercase">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input w-full mt-1"
                value={form.purchaseQuantity}
                onChange={(e) => set("purchaseQuantity", e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 uppercase">
                Purchase Price (QAR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input w-full mt-1"
                value={form.purchasePrice}
                onChange={(e) => set("purchasePrice", e.target.value)}
                placeholder="Total you paid"
              />
            </div>
          </div>

          {totalGrams > 0 && (
            <div className="mt-4 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-600 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                Total grams:{" "}
                <strong className="text-stone-800">
                  {totalGrams.toLocaleString()} g
                </strong>
              </span>
              {costPerGram > 0 && (
                <span>
                  Cost / g:{" "}
                  <strong className="text-stone-800">
                    {costPerGram.toFixed(4)} QAR
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* PRICING */}
        <div className="border-t border-stone-200 pt-6">
          <h3 className="text-sm font-black text-stone-800 mb-3">Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-600 uppercase">
                Sell Price / gram (QAR) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="input w-full mt-1"
                value={form.sellPricePerGram}
                onChange={(e) => set("sellPricePerGram", e.target.value)}
                placeholder="e.g. 0.05"
              />
              {sellPerGram > 0 && costPerGram > 0 && (
                <p
                  className={`text-xs mt-1 font-semibold ${
                    sellPerGram < costPerGram
                      ? "text-red-600"
                      : marginPct < 10
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {sellPerGram < costPerGram
                    ? `⚠ Below cost (${costPerGram.toFixed(4)})`
                    : `Margin: ${marginPct.toFixed(1)}%`}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 uppercase">
                Low-stock Threshold (grams)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="input w-full mt-1"
                value={form.lowStockThresholdGrams}
                onChange={(e) =>
                  set("lowStockThresholdGrams", e.target.value)
                }
              />
              <p className="text-xs text-stone-400 mt-1">
                Row turns orange when current stock ≤ this value.
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVE */}
        <div className="flex items-center gap-3">
          <input
            id="active"
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          <label
            htmlFor="active"
            className="text-sm font-semibold text-stone-700"
          >
            Active
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2 border-t border-stone-200">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving…" : "Create Stock"}
          </button>
          <Link href="/admin/stock" className="btn btn-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
