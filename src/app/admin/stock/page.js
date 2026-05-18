"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";

const getPrice = (s) => {
  if (s.type === "bundle") return Number(s.price) || 0;
  const variants = Array.isArray(s.variants) ? s.variants : [];
  if (variants.length > 0) return Number(variants[0]?.price) || 0;
  return Number(s.price) || 0;
};

// ─── STOCK ROW — memoized so only changed rows re-render ──────────────────────
const StockRow = memo(function StockRow({ s, isSelected, onToggle, onToggleActive, onSetCategory }) {
  const price = getPrice(s);
  const pcs = Number(s.currentStockPcs);
  const threshold = Number(s.lowStockThresholdPcs || 5);
  const empty = pcs <= 0;
  const low = !empty && pcs <= threshold;

  return (
    <tr
      className={`transition-colors ${
        isSelected
          ? "bg-amber-50"
          : empty
          ? "bg-red-50 hover:bg-red-100"
          : low
          ? "bg-orange-50 hover:bg-orange-100"
          : "hover:bg-stone-50"
      }`}
    >
      {/* CHECKBOX */}
      <td className="py-4 px-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(s.id)}
          className="rounded"
        />
      </td>

      {/* ITEM */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {s.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.images[0]}
                alt={s.nameEn}
                loading="lazy"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl">🧂</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-stone-800 text-sm">{s.nameEn}</p>
              {s.type === "bundle" && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">BUNDLE</span>
              )}
              {s.featured && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⭐ FEATURED</span>
              )}
              {s.bestSeller && (
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🔥 BEST</span>
              )}
            </div>
            <p className="text-xs text-stone-400">{s.nameAr}</p>
          </div>
        </div>
      </td>

      {/* CATEGORY */}
      <td className="py-4 px-4">
        {s.category ? (
          <button
            onClick={() => onSetCategory(String(s.category.id))}
            className="text-xs font-semibold bg-stone-100 text-stone-600 px-2 py-1 rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors"
          >
            {s.category.nameEn}
          </button>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        )}
      </td>

      {/* STOCK PCS */}
      <td className="py-4 px-4">
        <p className={`text-sm font-bold ${empty ? "text-red-700" : low ? "text-orange-700" : "text-stone-800"}`}>
          {pcs} pcs
        </p>
        {empty && (
          <span className="inline-block mt-1 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">OUT OF STOCK</span>
        )}
        {low && (
          <span className="inline-block mt-1 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">LOW</span>
        )}
      </td>

      {/* PRICE — computed once above, used here */}
      <td className="py-4 px-4">
        {price > 0 ? (
          <span className="text-sm font-bold text-stone-800">
            {price.toFixed(2)}{" "}
            <span className="text-xs font-normal text-stone-400">QAR</span>
          </span>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        )}
      </td>

      {/* IN BUNDLES */}
      <td className="py-4 px-4">
        {Number(s._count?.inBundles) > 0 ? (
          <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
            {s._count.inBundles} bundle{s._count.inBundles === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        )}
      </td>

      {/* ACTIVE TOGGLE */}
      <td className="py-4 px-4">
        <button
          onClick={() => onToggleActive(s.id, s.active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.active ? "bg-green-500" : "bg-stone-300"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.active ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </td>

      {/* ACTIONS */}
      <td className="py-4 px-4">
        <Link
          href={`/admin/stock/${s.id}/edit`}
          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors inline-flex"
          title="Edit / Restock"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
      </td>
    </tr>
  );
});

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function AdminStockPage() {
  const [stocks, setStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const token = () => localStorage.getItem("adminToken");

  // ─── SMART STATE UPDATE — only replaces stocks if data actually changed ─────
  // Prevents the polling-triggered white flash: if data is identical, the same
  // array reference is returned so React bails out of re-rendering entirely.
  const applyStocksUpdate = useCallback((newData) => {
    setStocks((prev) => {
      if (prev.length !== newData.length) return newData;
      const changed = newData.some((s, i) => {
        const p = prev[i];
        return !p || p.id !== s.id || p.currentStockPcs !== s.currentStockPcs || p.active !== s.active;
      });
      return changed ? newData : prev;
    });
  }, []);

  const fetchStocks = useCallback(async (lowFilter, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lowFilter) params.set("low", "true");
      const res = await fetch(`/api/admin/stock?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        if (silent) {
          applyStocksUpdate(data.data);
        } else {
          setStocks(data.data);
        }
      }
    } catch (e) {
      console.error("Fetch stock error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyStocksUpdate]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (e) {
      console.error("Fetch categories error:", e);
    }
  }, []);

  useEffect(() => {
    fetchStocks(lowOnly);
    fetchCategories();
  }, [lowOnly, fetchStocks, fetchCategories]);

  usePolling(() => fetchStocks(lowOnly, true), 15000);

  // ─── MEMOIZED FILTER — recomputes only when inputs change ─────────────────
  const filtered = useMemo(() => stocks.filter((s) => {
    const matchSearch =
      !search ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.nameAr.includes(search);
    const matchType = typeFilter === "all" || s.type === typeFilter;
    const matchCat =
      categoryFilter === "all"
        ? true
        : categoryFilter === "none"
        ? !s.categoryId
        : s.category?.id === Number(categoryFilter);
    return matchSearch && matchType && matchCat;
  }), [stocks, search, typeFilter, categoryFilter]);

  // ─── MEMOIZED DERIVED VALUES ──────────────────────────────────────────────
  const totalLow = useMemo(
    () => stocks.filter((s) => {
      const pcs = Number(s.currentStockPcs);
      return pcs <= 0 || pcs <= Number(s.lowStockThresholdPcs || 5);
    }).length,
    [stocks]
  );

  // ─── PAGINATION ───────────────────────────────────────────────────────────
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [search, typeFilter, categoryFilter, lowOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const allFilteredIds = useMemo(() => filtered.map((s) => s.id), [filtered]);

  const categoryTabs = useMemo(() => [
    { id: "all", label: "All", count: stocks.length },
    { id: "none", label: "Uncategorized", count: stocks.filter((s) => !s.categoryId).length },
    ...categories.map((c) => ({
      id: String(c.id),
      label: c.nameEn,
      count: stocks.filter((s) => s.category?.id === c.id).length,
    })),
  ], [stocks, categories]);

  // ─── SELECTION ───────────────────────────────────────────────────────────
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  // Stable callbacks — won't recreate on every render
  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (allFilteredIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...allFilteredIds]);
    });
  }, [allFilteredIds]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // ─── ACTIVE TOGGLE ────────────────────────────────────────────────────────
  const toggleActive = useCallback(async (id, current) => {
    try {
      const res = await fetch(`/api/admin/stock/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ active: !current }),
      });
      const data = await res.json();
      if (data.success)
        setStocks((prev) => prev.map((s) => (s.id === id ? { ...s, active: !current } : s)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── BULK ACTIONS ─────────────────────────────────────────────────────────
  const bulkSetActive = async (active) => {
    setBulkLoading(true);
    const ids = [...selected];
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/stock/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ active }),
        })
      )
    );
    setStocks((prev) => prev.map((s) => (selected.has(s.id) ? { ...s, active } : s)));
    clearSelection();
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    setBulkLoading(true);
    setConfirmDelete(false);
    const ids = [...selected];
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/stock/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token()}` },
        })
      )
    );
    setStocks((prev) => prev.filter((s) => !selected.has(s.id)));
    clearSelection();
    setBulkLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Stock / Inventory</h2>
          <p className="text-stone-500 text-sm mt-1">
            {filtered.length} item{filtered.length === 1 ? "" : "s"}
            {totalLow > 0 && (
              <span className="ml-2 text-red-600 font-semibold">
                · {totalLow} need attention
              </span>
            )}
          </p>
        </div>
        <Link href="/admin/stock/new" className="btn btn-primary">
          + Add Stock
        </Link>
      </div>

      {/* CATEGORY TABS */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <p className="text-xs font-bold text-stone-400 uppercase mb-3">Category</p>
        <div className="flex gap-2 flex-wrap">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                categoryFilter === tab.id
                  ? "bg-amber-700 text-white border-amber-700"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${categoryFilter === tab.id ? "text-amber-200" : "text-stone-400"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* TYPE + SEARCH FILTERS */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stock..."
              className="input w-full pl-9"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2">
            {[["all", "All"], ["single", "Single"], ["bundle", "Bundle"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  typeFilter === val
                    ? val === "bundle"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            <span className="text-sm font-semibold text-stone-700 whitespace-nowrap">Low stock only</span>
          </label>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {someSelected && (
        <div className="bg-stone-900 text-white rounded-2xl px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-bold">{selected.size} selected</span>
          <div className="flex gap-2 flex-wrap flex-1">
            <button onClick={() => bulkSetActive(true)} disabled={bulkLoading} className="px-4 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">Activate</button>
            <button onClick={() => bulkSetActive(false)} disabled={bulkLoading} className="px-4 py-1.5 bg-stone-600 hover:bg-stone-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">Deactivate</button>
            <button onClick={() => setConfirmDelete(true)} disabled={bulkLoading} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">Delete</button>
          </div>
          <button onClick={clearSelection} className="text-stone-400 hover:text-white text-xs underline">Cancel</button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-4xl animate-bounce">🧂</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-3">📦</div>
            <p className="font-semibold">No stock items found</p>
            <p className="text-sm mt-1">Try a different filter or click &ldquo;Add Stock&rdquo;.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Stock (pcs)</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Price</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">In Bundles</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Active</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginated.map((s) => (
                  <StockRow
                    key={s.id}
                    s={s}
                    isSelected={selected.has(s.id)}
                    onToggle={toggleOne}
                    onToggleActive={toggleActive}
                    onSetCategory={setCategoryFilter}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 px-5 py-3">
          <p className="text-xs text-stone-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-stone-400 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === p
                        ? "bg-amber-700 text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-4xl mb-3 text-center">🗑️</div>
            <h3 className="text-lg font-black text-stone-800 text-center mb-2">
              Delete {selected.size} item{selected.size === 1 ? "" : "s"}?
            </h3>
            <p className="text-sm text-stone-500 text-center mb-6">
              This cannot be undone. Stock records, restock history, and all related data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-colors">
                Cancel
              </button>
              <button onClick={bulkDelete} disabled={bulkLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {bulkLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
