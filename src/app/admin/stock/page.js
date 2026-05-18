"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";

const formatGrams = (g) => {
  const n = Number(g) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} ton`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} kg`;
  return `${n.toFixed(0)} g`;
};

export default function AdminStockPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const fetchStocks = async (lowFilter, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (lowFilter) params.set("low", "true");
      const res = await fetch(`/api/admin/stock?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStocks(data.data);
    } catch (e) {
      console.error("Fetch stock error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks(lowOnly);
  }, [lowOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  usePolling(() => fetchStocks(lowOnly, true), 15000);

  const toggleActive = async (id, current) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/stock/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setStocks((prev) =>
          prev.map((s) => (s.id === id ? { ...s, active: !current } : s))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = stocks.filter(
    (s) =>
      !search ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.nameAr.includes(search)
  );

  const isLow = (s) =>
    Number(s.currentStockGrams) <= Number(s.lowStockThresholdGrams);
  const isEmpty = (s) => Number(s.currentStockGrams) <= 0;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Stock / Inventory</h2>
          <p className="text-stone-500 text-sm mt-1">
            {filtered.length} stock item{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/stock/new" className="btn btn-primary">
          + Add Stock
        </Link>
      </div>

      {/* FILTERS */}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            <span className="text-sm font-semibold text-stone-700">
              Low stock only
            </span>
          </label>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-4xl animate-bounce">🧂</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-3">📦</div>
            <p className="font-semibold">No stock items yet</p>
            <p className="text-sm mt-1">Click &ldquo;Add Stock&rdquo; to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Item
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Current / Total
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Cost / g
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Markup
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Used in
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Active
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      isEmpty(s)
                        ? "bg-red-50 hover:bg-red-100"
                        : isLow(s)
                        ? "bg-orange-50 hover:bg-orange-100"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {s.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.images[0]}
                              alt={s.nameEn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">🧂</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800 text-sm">
                            {s.nameEn}
                          </p>
                          <p className="text-xs text-stone-400">{s.nameAr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {s.category ? (
                        <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                          {s.category.nameEn}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            isEmpty(s)
                              ? "text-red-700"
                              : isLow(s)
                              ? "text-orange-700"
                              : "text-stone-800"
                          }`}
                        >
                          {formatGrams(s.currentStockGrams)}
                        </p>
                        <p className="text-xs text-stone-400">
                          / {formatGrams(s.totalStockGrams)}
                        </p>
                        {isEmpty(s) && (
                          <span className="inline-block mt-1 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                            OUT OF STOCK
                          </span>
                        )}
                        {!isEmpty(s) && isLow(s) && (
                          <span className="inline-block mt-1 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                            LOW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-stone-700">
                      {Number(s.costPerGram).toFixed(4)}
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-stone-800">
                      {s.pricingRule ? `${Number(s.pricingRule.markupPercent).toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-4 px-4 text-xs text-stone-500">
                      {s._count?.products || 0} product
                      {(s._count?.products || 0) === 1 ? "" : "s"} ·{" "}
                      {s._count?.bundleItems || 0} bundle
                      {(s._count?.bundleItems || 0) === 1 ? "" : "s"}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleActive(s.id, s.active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          s.active ? "bg-green-500" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            s.active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/stock/${s.id}/edit`}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          title="Edit / Restock"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
