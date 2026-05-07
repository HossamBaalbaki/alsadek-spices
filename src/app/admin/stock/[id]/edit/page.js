"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

const UNITS = [
  { value: "gram", label: "Gram (g)" },
  { value: "kilogram", label: "Kilogram (kg)" },
  { value: "ton", label: "Ton" },
];

const formatGrams = (g) => {
  const n = Number(g) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} ton`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} kg`;
  return `${n.toFixed(0)} g`;
};

const unitToGrams = (q, u) => {
  const n = Number(q) || 0;
  if (u === "ton") return n * 1_000_000;
  if (u === "kilogram") return n * 1000;
  return n;
};

export default function EditStockPage() {
  const { id } = useParams();
  const router = useRouter();

  const [stock, setStock] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(null);

  // Restock panel state
  const [restock, setRestock] = useState({
    purchaseUnit: "kilogram",
    purchaseQuantity: "",
    purchasePrice: "",
  });
  const [restocking, setRestocking] = useState(false);
  const [restockError, setRestockError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const [sRes, cRes] = await Promise.all([
        fetch(`/api/admin/stock/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/categories"),
      ]);
      const sData = await sRes.json();
      const cData = await cRes.json();
      if (sData.success) {
        setStock(sData.data);
        setForm({
          nameEn: sData.data.nameEn || "",
          nameAr: sData.data.nameAr || "",
          descriptionEn: sData.data.descriptionEn || "",
          descriptionAr: sData.data.descriptionAr || "",
          images: Array.isArray(sData.data.images) ? sData.data.images : [],
          categoryId: sData.data.categoryId ? String(sData.data.categoryId) : "",
          lowStockThresholdGrams: String(sData.data.lowStockThresholdGrams),
          active: sData.data.active,
        });
      }
      if (cData.success) setCategories(cData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading || !form || !stock) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-4xl animate-bounce">🧂</div>
      </div>
    );
  }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const costPerG = Number(stock.costPerGram) || 0;

  // Restock preview
  const restockGrams = unitToGrams(restock.purchaseQuantity, restock.purchaseUnit);
  const restockCostPerG =
    restockGrams > 0 ? Number(restock.purchasePrice) / restockGrams : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nameEn || !form.nameAr) {
      setError("Please enter name in both languages.");
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
        images: form.images,
        categoryId: form.categoryId || null,
        lowStockThresholdGrams: Number(form.lowStockThresholdGrams) || 500,
        active: form.active,
      };
      const res = await fetch(`/api/admin/stock/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) setError(data.message || "Update failed");
      else {
        setSuccess("Saved ✓");
        loadAll();
      }
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    setRestockError("");
    if (!Number(restock.purchaseQuantity) || Number(restock.purchaseQuantity) <= 0) {
      setRestockError("Quantity must be > 0.");
      return;
    }
    if (!Number(restock.purchasePrice) || Number(restock.purchasePrice) <= 0) {
      setRestockError("Price must be > 0.");
      return;
    }
    setRestocking(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/stock/${id}/restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purchaseUnit: restock.purchaseUnit,
          purchaseQuantity: Number(restock.purchaseQuantity),
          purchasePrice: Number(restock.purchasePrice),
        }),
      });
      const data = await res.json();
      if (!data.success) setRestockError(data.message || "Failed");
      else {
        setRestock({
          purchaseUnit: "kilogram",
          purchaseQuantity: "",
          purchasePrice: "",
        });
        loadAll();
      }
    } catch (e) {
      console.error(e);
      setRestockError("Network error");
    } finally {
      setRestocking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this stock item? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/stock/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message);
        return;
      }
      router.push("/admin/stock");
    } catch (e) {
      console.error(e);
    }
  };

  const isEmpty = stock.currentStockGrams <= 0;
  const isLow =
    !isEmpty &&
    Number(stock.currentStockGrams) <= Number(stock.lowStockThresholdGrams);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">
            Edit Stock · {stock.nameEn}
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Current:{" "}
            <strong
              className={
                isEmpty
                  ? "text-red-700"
                  : isLow
                  ? "text-orange-700"
                  : "text-stone-800"
              }
            >
              {formatGrams(stock.currentStockGrams)}
            </strong>{" "}
            / Total ever purchased: {formatGrams(stock.totalStockGrams)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50"
          >
            Delete
          </button>
          <Link href="/admin/stock" className="btn btn-outline">
            ← Back
          </Link>
        </div>
      </div>

      {/* STATUS CARD */}
      <div
        className={`rounded-2xl border p-4 ${
          isEmpty
            ? "bg-red-50 border-red-200"
            : isLow
            ? "bg-orange-50 border-orange-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm">
            <p className="font-bold">
              {isEmpty
                ? "⛔ Out of stock"
                : isLow
                ? "⚠ Low stock"
                : "✓ In stock"}
            </p>
            <p className="text-stone-600 text-xs mt-0.5">
              Threshold: {formatGrams(stock.lowStockThresholdGrams)} · Cost/g:{" "}
              {Number(stock.costPerGram).toFixed(4)} QAR
            </p>
          </div>
        </div>
      </div>

      {/* RESTOCK PANEL */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-sm font-black text-stone-800 mb-3">
          + Add Restock (Replenish)
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Log a new purchase batch. Cost per gram is recalculated as a
          weighted average.
        </p>
        {restockError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 mb-3">
            {restockError}
          </div>
        )}
        <form
          onSubmit={handleRestock}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">
              Unit
            </label>
            <select
              className="input w-full mt-1"
              value={restock.purchaseUnit}
              onChange={(e) =>
                setRestock((r) => ({ ...r, purchaseUnit: e.target.value }))
              }
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
              Quantity
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input w-full mt-1"
              value={restock.purchaseQuantity}
              onChange={(e) =>
                setRestock((r) => ({
                  ...r,
                  purchaseQuantity: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">
              Paid (QAR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input w-full mt-1"
              value={restock.purchasePrice}
              onChange={(e) =>
                setRestock((r) => ({ ...r, purchasePrice: e.target.value }))
              }
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={restocking}
              className="btn btn-primary w-full"
            >
              {restocking ? "Adding…" : "Add Stock"}
            </button>
          </div>
        </form>
        {restockGrams > 0 && (
          <p className="text-xs text-stone-500 mt-3">
            +{formatGrams(restockGrams)}
            {restockCostPerG > 0 &&
              ` · cost this batch: ${restockCostPerG.toFixed(4)} QAR/g`}
          </p>
        )}

        {/* Restock history */}
        {stock.restocks && stock.restocks.length > 0 && (
          <div className="mt-6 border-t border-stone-200 pt-4">
            <h4 className="text-xs font-bold text-stone-600 uppercase mb-2">
              History
            </h4>
            <div className="flex flex-col gap-1 text-sm">
              {stock.restocks.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between text-xs text-stone-600 border-b border-stone-100 py-1"
                >
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                  <span>
                    +{formatGrams(r.addedGrams)} · {r.purchaseQty}{" "}
                    {r.purchaseUnit} · {r.purchasePrice} QAR
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN INFO FORM */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase">
              Name (English) *
            </label>
            <input
              className="input w-full mt-1"
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
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
              dir="rtl"
            />
          </div>
        </div>

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

        <div>
          <label className="text-xs font-bold text-stone-600 uppercase">
            Category
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
          <label className="text-xs font-bold text-stone-600 uppercase mb-2 block">
            Images
          </label>
          <ImageUpload
            images={form.images}
            onChange={(urls) => set("images", urls)}
          />
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
            onChange={(e) => set("lowStockThresholdGrams", e.target.value)}
          />
        </div>

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

        <div className="flex gap-3 pt-2 border-t border-stone-200">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link href="/admin/stock" className="btn btn-outline">
            Cancel
          </Link>
        </div>

        {/* Linked products list */}
        {stock.products && stock.products.length > 0 && (
          <div className="border-t border-stone-200 pt-4">
            <h4 className="text-xs font-bold text-stone-600 uppercase mb-2">
              Linked Products
            </h4>
            <div className="flex flex-wrap gap-2">
              {stock.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="text-xs bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-full text-stone-700"
                >
                  {p.nameEn}
                </Link>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
