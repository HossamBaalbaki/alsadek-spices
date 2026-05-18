"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── MINI BAR CHART ──────────────────────────────────────────────────────────
function BarChart({ data, height = 120 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const barWidth = Math.max(2, Math.floor(560 / data.length) - 2);

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(560, data.length * (barWidth + 2))}
        height={height + 24}
        className="block"
      >
        {data.map((d, i) => {
          const barH = Math.max(2, (d.revenue / max) * height);
          const x = i * (barWidth + 2);
          const y = height - barH;
          const isToday =
            data.length <= 31 &&
            i === new Date().getDate() - 1;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={2}
                className={isToday ? "fill-amber-500" : "fill-amber-300"}
              />
              {/* only show label every nth bar to avoid clutter */}
              {(data.length <= 12 ||
                data.length <= 7 ||
                i % Math.ceil(data.length / 10) === 0) && (
                <text
                  x={x + barWidth / 2}
                  y={height + 16}
                  textAnchor="middle"
                  fontSize={9}
                  className="fill-stone-400"
                >
                  {d.label}
                </text>
              )}
              {/* tooltip-like title */}
              <title>
                {d.label}: {d.revenue.toFixed(2)} QAR ({d.count} orders)
              </title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── STATUS BAR ──────────────────────────────────────────────────────────────
function StatusBar({ byStatus, total }) {
  const statuses = [
    { key: "pending", label: "Pending", color: "bg-yellow-400" },
    { key: "confirmed", label: "Confirmed", color: "bg-blue-400" },
    { key: "preparing", label: "Preparing", color: "bg-purple-400" },
    { key: "out_for_delivery", label: "Out for Delivery", color: "bg-orange-400" },
    { key: "delivered", label: "Delivered", color: "bg-green-500" },
    { key: "cancelled", label: "Cancelled", color: "bg-red-400" },
  ];

  return (
    <div className="space-y-2">
      {statuses.map(({ key, label, color }) => {
        const count = byStatus[key] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-stone-500 w-28 shrink-0">{label}</span>
            <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className={`${color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-stone-700 w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, colorClass, href, trend }) {
  const inner = (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-2 transition-shadow hover:shadow-md ${colorClass}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <div className="flex items-center gap-1.5">
          {trend != null && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
          {sub && (
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">
              {sub}
            </span>
          )}
        </div>
      </div>
      <p className="text-xl font-black text-stone-800 leading-tight">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    preparing: "bg-purple-100 text-purple-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const label = status === "out_for_delivery" ? "Out for Delivery" : status;
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-stone-100 text-stone-500"}`}
    >
      {label}
    </span>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (p) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/dashboard?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  const fmt = (n) =>
    n == null ? "—" : `${Number(n).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR`;

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "";

  return (
    <div className="flex flex-col gap-6">

      {/* ─── HEADER ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Al Sadek Dashboard</h2>
          <p className="text-stone-400 text-sm mt-1">
            {new Date().toLocaleDateString("en", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 bg-stone-900/50 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.key
                  ? "bg-amber-500 text-white shadow"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl animate-bounce">📊</div>
            <p className="text-stone-400 text-sm">Loading {periodLabel}…</p>
          </div>
        </div>
      ) : (
        <>
          {/* ─── REVENUE KPIS ─────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
              Revenue — {periodLabel}
            </p>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                icon="✅"
                label="Confirmed Revenue"
                value={fmt(data?.revenue?.confirmed)}
                sub="Delivered only"
                colorClass="bg-green-50 border-green-200"
                href="/admin/orders?status=delivered"
                trend={data?.trends?.confirmedRevenue}
              />
              <KpiCard
                icon="⏳"
                label="Pending Payment"
                value={fmt(data?.revenue?.pending)}
                sub="Awaiting action"
                colorClass="bg-amber-50 border-amber-200"
                href="/admin/orders?status=pending"
              />
              <KpiCard
                icon="🔄"
                label="In Progress"
                value={fmt(data?.revenue?.inProgress)}
                sub="Confirmed → Delivery"
                colorClass="bg-blue-50 border-blue-200"
                href="/admin/orders"
              />
              <KpiCard
                icon="❌"
                label="Cancelled"
                value={fmt(data?.revenue?.cancelled)}
                sub="Not counted"
                colorClass="bg-red-50 border-red-200"
                href="/admin/orders?status=cancelled"
              />
            </div>
          </div>

          {/* ─── VOLUME KPIS ──────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
              Volume — {periodLabel}
            </p>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                icon="📦"
                label="Total Orders"
                value={data?.orders?.total ?? 0}
                colorClass="bg-white border-stone-200"
                href="/admin/orders"
                trend={data?.trends?.totalOrders}
              />
              <KpiCard
                icon="💰"
                label="Avg Order Value"
                value={fmt(data?.orders?.avgValue)}
                sub="Delivered orders"
                colorClass="bg-white border-stone-200"
                trend={data?.trends?.avgValue}
              />
              <KpiCard
                icon="👤"
                label="New Customers"
                value={data?.customers?.new ?? 0}
                sub={`${data?.customers?.total ?? 0} total`}
                colorClass="bg-white border-stone-200"
                href="/admin/customers"
                trend={data?.trends?.newCustomers}
              />
              <KpiCard
                icon="🌶️"
                label="Active Products"
                value={data?.products?.total ?? 0}
                colorClass="bg-white border-stone-200"
                href="/admin/stock"
              />
            </div>
          </div>

          {/* ─── CHART + STATUS BREAKDOWN ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-stone-800 text-sm">Revenue Trend</h3>
                  <p className="text-xs text-stone-400">Confirmed (delivered) orders only</p>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  {fmt(data?.revenue?.confirmed)}
                </span>
              </div>
              {data?.chart && data.chart.some((d) => d.revenue > 0) ? (
                <BarChart data={data.chart} />
              ) : (
                <div className="flex items-center justify-center h-32 text-stone-300 text-sm">
                  No delivered orders in this period
                </div>
              )}
            </div>

            {/* Orders by status */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="font-black text-stone-800 text-sm mb-1">Orders by Status</h3>
              <p className="text-xs text-stone-400 mb-4">{data?.orders?.total ?? 0} total orders</p>
              <StatusBar
                byStatus={data?.orders?.byStatus || {}}
                total={data?.orders?.total || 0}
              />

              {/* Revenue split visual */}
              <div className="mt-6 pt-4 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Revenue Split</p>
                {(() => {
                  const rev = data?.revenue || {};
                  const total =
                    (rev.confirmed || 0) +
                    (rev.pending || 0) +
                    (rev.inProgress || 0) +
                    (rev.cancelled || 0) || 1;
                  const segments = [
                    { label: "Delivered", val: rev.confirmed || 0, color: "bg-green-500" },
                    { label: "In Progress", val: rev.inProgress || 0, color: "bg-blue-400" },
                    { label: "Pending", val: rev.pending || 0, color: "bg-amber-400" },
                    { label: "Cancelled", val: rev.cancelled || 0, color: "bg-red-300" },
                  ];
                  return (
                    <>
                      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
                        {segments.map((s) => (
                          <div
                            key={s.label}
                            className={`${s.color} transition-all duration-500`}
                            style={{ width: `${(s.val / total) * 100}%` }}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {segments.map((s) => (
                          <div key={s.label} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
                            <span className="text-[10px] text-stone-500 truncate">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ─── LOW STOCK ALERT ────────────────────────────── */}
          {data?.lowStock?.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-base">⚠️</div>
                  <div>
                    <h3 className="font-black text-stone-800 text-sm">Low Stock Alert</h3>
                    <p className="text-xs text-red-500">{data.lowStock.length} item{data.lowStock.length !== 1 ? "s" : ""} need restocking</p>
                  </div>
                </div>
                <Link href="/admin/stock" className="text-xs font-semibold text-amber-700 hover:underline">
                  Manage Stock →
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {data.lowStock.map((s) => {
                  const isEmpty = s.currentStockPcs === 0;
                  const display = `${s.currentStockPcs} pcs`;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isEmpty ? "bg-red-500" : "bg-orange-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-stone-700 truncate">{s.nameEn}</p>
                          <span className={`text-[10px] font-bold ml-2 flex-shrink-0 ${isEmpty ? "text-red-600" : "text-orange-600"}`}>
                            {isEmpty ? "OUT OF STOCK" : display}
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isEmpty ? "bg-red-500 w-0" : "bg-orange-400"}`}
                            style={{ width: `${Math.min(s.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                      <Link href={`/admin/stock/${s.id}/edit`} className="flex-shrink-0 text-[10px] font-bold text-amber-700 hover:underline">
                        Restock
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── RECENT ORDERS ────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-stone-800 text-sm">Recent Orders</h3>
                <p className="text-xs text-stone-400">{periodLabel}</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                View all →
              </Link>
            </div>

            {!data?.recentOrders?.length ? (
              <div className="text-center py-10 text-stone-300">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm">No orders in this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      {["Order", "Customer", "Total", "Status", "Date"].map((h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-bold text-amber-700 hover:underline text-xs"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-stone-800 text-xs">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </p>
                          <p className="text-[10px] text-stone-400">{order.customer?.phone}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-stone-800 text-xs">
                            {Number(order.grandTotal).toFixed(2)} QAR
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 px-3 text-[10px] text-stone-400 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── QUICK ACTIONS ───────────────────────────── */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="font-black text-stone-800 text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "All Orders", icon: "📦", href: "/admin/orders" },
                { label: "Pending Orders", icon: "⏳", href: "/admin/orders?status=pending" },
                { label: "Add Stock Item", icon: "➕", href: "/admin/stock/new" },
                { label: "View Customers", icon: "👥", href: "/admin/customers" },
                { label: "Stock Management", icon: "📦", href: "/admin/stock" },
                { label: "Delivery Settings", icon: "🚚", href: "/admin/delivery-settings" },
                { label: "Site Settings", icon: "⚙️", href: "/admin/settings" },
                { label: "View Store", icon: "🛍️", href: "/" },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-stone-100 hover:border-amber-300 hover:bg-amber-50 transition-all text-center"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-semibold text-stone-700">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
