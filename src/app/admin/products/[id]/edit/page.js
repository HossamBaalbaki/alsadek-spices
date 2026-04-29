"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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
  const u = m[3];
  return u === "kg" ? n * 1000 : n;
};

export default function EditProductPage() {
  const router = useRouter();
  const { id: productId } = useParams();

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notFound, setNotFound] = useState(false);

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
    images: [""],
    featured: false,
    bestSeller: false,
    active: true,
    labels: {
      isNew: false,
      isHot: false,
      isSale: false,
      salePercent: 0,
      isLimited: false,
    },
  });

  const [variants, setVariants] = useState([{ weightLabel: "100g", grams: 100 }]);
  const [bundleItems, setBundleItems] = useState([{ stockId: "", gramsPerUnit: "" }]);

  useEffect(() => {
    if (!productId) return;

    (async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem("adminToken");

        const [catRes, stockRes, productRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/admin/stock", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/admin/products/${productId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const catData = await catRes.json();
        const stockData = await stockRes.json();
        const productData = await productRes.json();

        if (catData.success) setCategories(catData.data);
        if (stockData.success) setStocks(stockData.data.filter((s) => s.active));

        if (!productData.success) {
          setNotFound(true);
          return;
        }

        const p = productData.data;
        const labels = p.labels || {};

        setForm({
          type: p.type || "single",
          slug: p.slug || "",
          categoryId: p.categoryId ? String(p.categoryId) : "",
          stockId: p.stockId ? String(p.stockId) : "",
          nameEn: p.nameEn || "",
          nameAr: p.nameAr || "",
          descriptionEn: p.descriptionEn || "",
          descriptionAr: p.descriptionAr || "",
          price: p.price ?? "",
          originalPrice: p.originalPrice ?? "",
          images: p.images?.length ? p.images : [""],
          featured: !!p.featured,
          bestSeller: !!p.bestSeller,
          active: p.active !== undefined ? p.active : true,
          labels: {
            isNew: !!labels.isNew,
            isHot: !!labels.isHot,
            isSale: !!labels.isSale,
            salePercent: Number(labels.salePercent) || 0,
            isLimited: !!labels.isLimited,
          },
        });

        if (p.type === "single") {
          const loadedVariants = Array.isArray(p.variants)
            ? p.variants
                .map((v) => ({
                  weightLabel: String(v.weightLabel || v.weight || "").trim(),
                  grams: Number(v.grams) || parseWeightToGrams(v.weightLabel || v.weight),
                }))
                .filter((v) => v.weightLabel && v.grams > 0)
            : [];
          setVariants(loadedVariants.length ? loadedVariants : [{ weightLabel: "100g", grams: 100 }]);
          setBundleItems([{ stockId: "", gramsPerUnit: "" }]);
        } else {
          const loadedBundle = Array.isArray(p.bundleItems)
            ? p.bundleItems.map((b) => ({
                stockId: String(b.stockId),
                gramsPerUnit: String(b.gramsPerUnit ?? ""),
              }))
            : [];
          setBundleItems(loadedBundle.length ? loadedBundle : [{ stockId: "", gramsPerUnit: "" }]);
          setVariants([{ weightLabel: "100g", grams: 100 }]);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load product");
      } finally {
        setFetching(false);
      }
    })();
  }, [productId]);

  const selectedStock = useMemo(
    () => stocks.find((s) => s.id === Number(form.stockId)),
    [stocks, form.stockId]
  );

  const stockSellPerGram = Number(selectedStock?.sellPricePerGram || 0);
  const variantPreview = useMemo(
    () =>
      variants.map((v) => ({
        ...v,
        price: v.grams > 0 ? v.grams * stockSellPerGram : 0,
      })),
    [variants, stockSellPerGram]
  );

  const bundleCost = useMemo(() => {
    return bundleItems.reduce((sum, item) => {
      const st = stocks.find((s) => s.id === Number(item.stockId));
      const grams = Number(item.gramsPerUnit) || 0;
      const c = Number(st?.costPerGram || 0);
      return sum + grams * c;
    }, 0);
  }, [bundleItems, stocks]);

  const handleChange = (field, value) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleLabelChange = (field, value) =>
    setForm((p) => ({ ...p, labels: { ...p.labels, [field]: value } }));

  const handleImageChange = (i, value) => {
    setForm((p) => {
      const arr = [...p.images];
      arr[i] = value;
      return { ...p, images: arr };
    });
  };
  const addImage = () =>
    setForm((p) => ({ ...p, images: [...p.images, ""] }));
  const removeImage = (i) =>
    setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));

  const handleVariantChange = (i, field, value) => {
    setVariants((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === "weightLabel") next[i].grams = parseWeightToGrams(value);
      return next;
    });
  };
  const addVariant = () =>
    setVariants((prev) => [...prev, { weightLabel: "", grams: 0 }]);
  const removeVariant = (i) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const handleBundleItemChange = (i, field, value) => {
    setBundleItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };
  const addBundleItem = () =>
    setBundleItems((prev) => [...prev, { stockId: "", gramsPerUnit: "" }]);
  const removeBundleItem = (i) =>
    setBundleItems((prev) => prev.filter((_, idx) => idx !== i));

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
          }))
          .filter((v) => v.weightLabel && v.grams > 0);

        if (!cleanVariants.length) {
          setError("Add at least one valid variant.");
          setLoading(false);
          return;
        }

        payload = {
          type: "single",
          slug: form.slug,
          categoryId: Number(form.categoryId),
          stockId: Number(form.stockId),
          variants: cleanVariants,
          images: form.images.filter((u) => u.trim()),
          labels: { ...form.labels, salePercent: salePct },
          featured: form.featured,
          bestSeller: form.bestSeller,
          active: form.active,
        };
      } else {
        const cleanBundleItems = bundleItems
          .map((b) => ({
            stockId: Number(b.stockId),
            gramsPerUnit: Number(b.gramsPerUnit),
          }))
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
          images: form.images.filter((u) => u.trim()),
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          bundleItems: cleanBundleItems,
          labels: { ...form.labels, salePercent: salePct },
          featured: form.featured,
          bestSeller: form.bestSeller,
          active: form.active,
        };
      }

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("Product updated successfully!");
        setTimeout(() => router.push("/admin/products"), 1000);
      } else {
        setError(data.message || "Failed to update product");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) router.push("/admin/products");
      else setError(data.message || "Failed to delete product");
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-5xl animate-bounce">🌶️</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200 p-8 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="font-black text-stone-800 text-xl mb-2">Product Not Found</h2>
        <p className="text-stone-500 text-sm mb-6">The product you are trying to edit does not exist.</p>
        <Link href="/admin/products" className="inline-block px-6 py-2.5 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800">
          ← Back to Products
        </Link>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm";

  const flagItems = [
    { key: "featured", label: "⭐ Featured", state: form.featured, onChange: (v) => handleChange("featured", v) },
    { key: "bestSeller", label: "🔥 Best Seller", state: form.bestSeller, onChange: (v) => handleChange("bestSeller", v) },
    { key: "active", label: "✅ Active", state: form.active, onChange: (v) => handleChange("active", v) },
    { key: "isNew", label: "🆕 New", state: form.labels.isNew, onChange: (v) => handleLabelChange("isNew", v) },
    { key: "isHot", label: "🌶️ Hot", state: form.labels.isHot, onChange: (v) => handleLabelChange("isHot", v) },
    { key: "isSale", label: "💰 Sale", state: form.labels.isSale, onChange: (v) => handleLabelChange("isSale", v) },
    { key: "isLimited", label: "⏳ Limited", state: form.labels.isLimited, onChange: (v) => handleLabelChange("isLimited", v) },
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Edit Product</h2>
          <p className="text-stone-500 text-sm mt-1">ID: #{productId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-sm">
            ← Back
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-semibold text-sm">❌ {error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-semibold text-sm">✅ {success}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
          <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-3">Core Product Setup</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className={inputClass}
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
                className={inputClass}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nameEn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                className={`${inputClass} font-mono`}
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
                  }}
                  className={inputClass}
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
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm">
                <p className="font-bold text-stone-700">Stock pricing</p>
                <p className="text-stone-600">Sell / g: <b>{Number(selectedStock?.sellPricePerGram || 0).toFixed(3)}</b></p>
                <p className="text-stone-600">Cost / g: <b>{Number(selectedStock?.costPerGram || 0).toFixed(4)}</b></p>
              </div>
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
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Name (Arabic) *</label>
                <input
                  value={form.nameAr}
                  onChange={(e) => handleChange("nameAr", e.target.value)}
                  className={`${inputClass} text-right`}
                  dir="rtl"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {form.type === "single" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-800 text-lg">Variants</h3>
              <button type="button" onClick={addVariant} className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold">+ Add Variant</button>
            </div>
            {variantPreview.map((v, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <input
                  type="text"
                  value={v.weightLabel}
                  onChange={(e) => handleVariantChange(i, "weightLabel", e.target.value)}
                  placeholder="e.g. 100g / 250g / 1kg"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={v.grams}
                  onChange={(e) => handleVariantChange(i, "grams", Number(e.target.value))}
                  min="1"
                  className={inputClass}
                />
                <div className="text-sm text-stone-700">Price preview: <b>{Number(v.price || 0).toFixed(2)} QAR</b></div>
                {variants.length > 1 ? (
                  <button type="button" onClick={() => removeVariant(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">✕</button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>
        )}

        {form.type === "bundle" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-800 text-lg">Bundle Contents</h3>
              <button type="button" onClick={addBundleItem} className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold">+ Add Item</button>
            </div>

            {bundleItems.map((b, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <select
                  value={b.stockId}
                  onChange={(e) => handleBundleItemChange(i, "stockId", e.target.value)}
                  className={inputClass}
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
                  placeholder="grams used per bundle"
                  min="1"
                  className={inputClass}
                />

                <div className="text-xs text-stone-500">
                  Cost impact:{" "}
                  <b>
                    {(
                      (Number(b.gramsPerUnit) || 0) *
                      Number(stocks.find((s) => s.id === Number(b.stockId))?.costPerGram || 0)
                    ).toFixed(2)}{" "}
                    QAR
                  </b>
                </div>

                {bundleItems.length > 1 ? (
                  <button type="button" onClick={() => removeBundleItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">✕</button>
                ) : (
                  <div />
                )}
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
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Original Price (QAR)</label>
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => handleChange("originalPrice", e.target.value)}
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm">
                <p className="font-bold text-stone-700">Estimated bundle cost</p>
                <p className="text-stone-600">{bundleCost.toFixed(2)} QAR</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-black text-stone-800 text-lg">Images (optional override)</h3>
            <button type="button" onClick={addImage} className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold">+ Add Image</button>
          </div>
          {form.images.map((img, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="text"
                value={img}
                onChange={(e) => handleImageChange(i, e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={`flex-1 ${inputClass}`}
              />
              {form.images.length > 1 && (
                <button type="button" onClick={() => removeImage(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
          <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-3">Labels & Flags</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {flagItems.map((item) => (
              <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${item.state ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}>
                <input type="checkbox" checked={item.state} onChange={(e) => item.onChange(e.target.checked)} className="w-4 h-4 accent-amber-700" />
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
                  className={`${inputClass} max-w-[140px] border-rose-200`}
                />
                <span className="text-sm font-semibold text-rose-700">% OFF</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button type="button" onClick={handleDelete} disabled={deleting} className="px-6 py-2.5 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm disabled:opacity-50">
            {deleting ? "Deleting..." : "🗑️ Delete Product"}
          </button>
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-sm">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800 disabled:opacity-50">
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
