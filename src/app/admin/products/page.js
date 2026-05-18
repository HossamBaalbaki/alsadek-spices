"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [produceModal, setProduceModal] = useState(null);
  const [producing, setProducing] = useState(false);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (error) {
      console.error("Fetch products error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  usePolling(() => fetchProducts(true), 20000);

  const toggleActive = async (productId, currentActive) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, active: !currentActive } : p))
        );
      }
    } catch (error) {
      console.error("Toggle active error:", error);
    }
  };

  const handleProduce = async () => {
    if (!produceModal) return;
    const qty = parseInt(produceModal.quantity);
    if (!qty || qty <= 0) return;

    setProducing(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/products/${produceModal.productId}/produce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setProduceModal(null);
        fetchProducts();
      } else {
        showToast(data.message || "Production failed", false);
      }
    } catch {
      showToast("Network error", false);
    } finally {
      setProducing(false);
    }
  };

  const bulkToggleActive = async (active) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const token = localStorage.getItem("adminToken");
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ active }),
          })
        )
      );
      setProducts((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, active } : p)));
      setSelected(new Set());
    } catch (error) {
      console.error("Bulk toggle error:", error);
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      !search ||
      product.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      product.nameAr.includes(search);
    const matchCategory =
      categoryFilter === "all" || product.category?.slug === categoryFilter;
    return matchSearch && matchCategory;
  });

  const formatGrams = (g) => {
    const n = Number(g) || 0;
    if (n >= 1000) return `${(n / 1000).toFixed(2)} kg`;
    return `${n.toFixed(0)} g`;
  };

  const getPrice = (product) => {
    if (product.type === "bundle") {
      const p = Number(product.price);
      return Number.isFinite(p) ? p : 0;
    }
    const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
    const variantPrice = Number(firstVariant?.price);
    if (Number.isFinite(variantPrice) && variantPrice > 0) return variantPrice;
    const fallback = Number(product.price);
    return Number.isFinite(fallback) ? fallback : 0;
  };

  const getStockBadge = (product) => {
    if (product.type === "bundle") {
      const n = Number(product.bundleStock) || 0;
      const cls =
        n > 10
          ? "bg-green-100 text-green-700"
          : n > 0
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700";
      return { cls, text: `${n} units` };
    }

    if (product.stock && typeof product.stock === "object") {
      const grams = Number(product.stock.currentStockGrams) || 0;
      const low = Number(product.stock.lowStockThresholdGrams) || 0;
      const cls =
        grams <= 0
          ? "bg-red-100 text-red-700"
          : grams <= low
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700";
      return { cls, text: grams <= 0 ? "Out" : formatGrams(grams) };
    }

    return { cls: "bg-stone-100 text-stone-500", text: "—" };
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* ─── HEADER ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Products</h2>
          <p className="text-stone-500 text-sm mt-1">
            {filteredProducts.length} products found
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      {/* ─── BULK ACTION TOOLBAR ─────────────────────────── */}
      {selected.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-amber-800">
            {selected.size} product{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              onClick={() => bulkToggleActive(true)}
              disabled={bulkLoading}
              className="btn btn-sm bg-green-600 text-white hover:bg-green-700 border-0"
            >
              Activate
            </button>
            <button
              onClick={() => bulkToggleActive(false)}
              disabled={bulkLoading}
              className="btn btn-sm bg-stone-600 text-white hover:bg-stone-700 border-0"
            >
              Deactivate
            </button>
            <button
              onClick={() => setSelected(new Set())}
              disabled={bulkLoading}
              className="btn btn-sm btn-outline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ─── FILTERS ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input w-full pl-9"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.nameEn}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── PRODUCTS TABLE ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-4xl animate-bounce">🌶️</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selected.size === filteredProducts.length}
                      onChange={() => setSelected(
                        selected.size === filteredProducts.length
                          ? new Set()
                          : new Set(filteredProducts.map((p) => p.id))
                      )}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Price</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Stock</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase hidden lg:table-cell">Rating</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase hidden md:table-cell">Labels</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((product) => {
                  const badge = getStockBadge(product);
                  return (
                    <tr key={product.id} className={`hover:bg-stone-50 transition-colors ${selected.has(product.id) ? "bg-amber-50" : ""}`}>
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selected.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">{product.type === "bundle" ? "📦" : "🌶️"}</span>
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 text-sm">{product.nameEn}</p>
                            <p className="text-xs text-stone-400">{product.nameAr}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-stone-400">{product.slug}</span>
                              {product.type === "bundle" && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">Bundle</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden sm:table-cell">
                        <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                          {product.category?.nameEn}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-stone-800 text-sm">
                          {getPrice(product).toFixed(2)} QAR
                        </p>
                        {product.type === "single" && product.variants?.length > 1 && (
                          <p className="text-xs text-stone-400">{product.variants.length} variants</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">⭐</span>
                          <span className="text-sm font-semibold text-stone-700">{product.rating}</span>
                          <span className="text-xs text-stone-400">({product.reviewCount})</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {product.labels?.isNew && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">New</span>
                          )}
                          {product.labels?.isHot && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">Hot</span>
                          )}
                          {product.labels?.isSale && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Sale</span>
                          )}
                          {product.labels?.isLimited && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Limited</span>
                          )}
                          {product.bestSeller && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Best</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleActive(product.id, product.active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            product.active ? "bg-green-500" : "bg-stone-300"
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            product.active ? "translate-x-6" : "translate-x-1"
                          }`} />
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors"
                            title="View Product"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            title="Edit Product"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          {product.type === "bundle" && (
                            <button
                              onClick={() => setProduceModal({ productId: product.id, productName: product.nameEn, quantity: "" })}
                              className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                              title="Produce Bundle Units"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── PRODUCE MODAL ─────────────────────────── */}
      {produceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-stone-800 mb-1">Produce Bundle Units</h3>
            <p className="text-sm text-stone-500 mb-5">{produceModal.productName}</p>

            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Quantity to produce
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={produceModal.quantity}
              onChange={(e) => setProduceModal((m) => ({ ...m, quantity: e.target.value }))}
              className="input w-full mb-5"
              placeholder="e.g. 10"
              autoFocus
            />

            <p className="text-xs text-stone-400 mb-5">
              Raw materials will be deducted from stock according to the bundle recipe.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setProduceModal(null)}
                className="btn btn-outline flex-1"
                disabled={producing}
              >
                Cancel
              </button>
              <button
                onClick={handleProduce}
                disabled={producing || !parseInt(produceModal.quantity) || parseInt(produceModal.quantity) <= 0}
                className="btn btn-primary flex-1"
              >
                {producing ? "Producing..." : "Produce"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
