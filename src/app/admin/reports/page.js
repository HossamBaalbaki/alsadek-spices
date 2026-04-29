"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const fmt = (n) => `${Number(n).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR`;

function StatCard({ label, value, sub, color = "text-stone-800" }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-sm text-stone-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem("adminToken");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleExport = () => {
    const params = new URLSearchParams({ from, to });
    fetch(`/api/admin/orders/export?${params}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `orders-${from}-to-${to}.csv`;
        a.click();
      });
  };

  const maxRevenue = data ? Math.max(...data.byDay.map((d) => d.revenue), 1) : 1;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Reports</h2>
          <p className="text-stone-500 text-sm mt-1">Revenue and order analytics</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline btn-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} max={to} />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} min={from} max={today} />
          </div>
          <button onClick={fetchReport} className="btn btn-primary">Apply</button>
          {[
            { label: "Today", f: today, t: today },
            { label: "This Month", f: monthStart, t: today },
            { label: "Last 7 days", f: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), t: today },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => { setFrom(p.f); setTo(p.t); }}
              className="btn btn-outline btn-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-4xl animate-bounce">📊</div>
        </div>
      ) : data ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={fmt(data.summary.revenue)} color="text-green-700" />
            <StatCard label="Total Orders" value={data.summary.totalOrders} />
            <StatCard label="Avg Order Value" value={fmt(data.summary.avgOrder)} color="text-amber-700" />
            <StatCard label="Cancel Rate" value={`${data.summary.cancelRate.toFixed(1)}%`} color={data.summary.cancelRate > 15 ? "text-red-600" : "text-stone-800"} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Delivered" value={data.summary.delivered} color="text-green-700" />
            <StatCard label="In Progress" value={data.summary.inProgress} color="text-blue-700" />
            <StatCard label="Pending" value={data.summary.pending} color="text-yellow-700" />
            <StatCard label="Cancelled" value={data.summary.cancelled} color="text-red-600" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Revenue Chart */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-black text-stone-800 mb-4">Daily Revenue</h3>
              {data.byDay.length === 0 ? (
                <p className="text-stone-400 text-sm text-center py-8">No data for this period</p>
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                  {data.byDay.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[28px] group relative">
                      <div
                        className="w-full bg-amber-500 rounded-t-sm hover:bg-amber-600 transition-colors"
                        style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 128)}px` }}
                        title={`${d.date}: ${fmt(d.revenue)}`}
                      />
                      <span className="text-[9px] text-stone-400 rotate-45 origin-left whitespace-nowrap">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-black text-stone-800 mb-4">Top Products</h3>
              {data.topProducts.length === 0 ? (
                <p className="text-stone-400 text-sm">No delivered orders yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="text-xs font-black text-stone-400 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">{p.name}</p>
                      </div>
                      <span className="text-xs font-black text-amber-700">{p.qty} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Promo Usage */}
          {data.promoUsage.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-black text-stone-800 mb-4">Promo Code Usage</h3>
              <div className="flex flex-wrap gap-3">
                {data.promoUsage.map((p) => (
                  <div key={p.code} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="font-mono font-black text-stone-800 text-sm">{p.code}</span>
                    <span className="text-xs font-bold text-amber-700">{p.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
