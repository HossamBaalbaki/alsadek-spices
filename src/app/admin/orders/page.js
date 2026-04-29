"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (error) {
      console.error("Update status error:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "confirmed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "preparing": return "bg-purple-100 text-purple-700 border-purple-200";
      case "out_for_delivery": return "bg-orange-100 text-orange-700 border-orange-200";
      case "delivered": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "preparing", label: "Preparing" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(s) ||
      order.customer?.firstName?.toLowerCase().includes(s) ||
      order.customer?.lastName?.toLowerCase().includes(s) ||
      order.customer?.phone?.includes(s)
    );
  });

  return (
    <div className="flex flex-col gap-6">

      {/* ─── HEADER ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Orders</h2>
          <p className="text-stone-500 text-sm mt-1">
            {filteredOrders.length} orders found
          </p>
        </div>
        <a
          href={`/api/admin/orders/export${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`}
          className="btn btn-outline btn-sm flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            const token = localStorage.getItem("adminToken");
            const url = `/api/admin/orders/export${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`;
            fetch(url, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => r.blob())
              .then((blob) => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
              });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </a>
      </div>

      {/* ─── FILTERS ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number, name, phone..."
              className="input w-full pl-9"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── STATUS TABS ─────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              statusFilter === opt.value
                ? "bg-amber-700 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-amber-300"
            }`}
          >
            {opt.label}
            {opt.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── ORDERS TABLE ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-4xl animate-bounce">📦</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Order</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Items</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Payment</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-black text-amber-700 text-sm hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-stone-800 text-sm">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                      <p className="text-xs text-stone-400">{order.customer?.phone}</p>
                      <p className="text-xs text-stone-400">{order.customer?.city}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-stone-600">
                        {order.items?.length || 0} items
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-black text-stone-800">
                        {order.grandTotal.toFixed(2)} QAR
                      </p>
                      {order.discountAmount > 0 && (
                        <p className="text-xs text-green-600">
                          -{order.discountAmount.toFixed(2)} discount
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold text-stone-600 capitalize">
                        {order.paymentMethod?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-stone-400">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, "")}?text=Hello ${order.customer?.firstName}, your order ${order.orderNumber} status has been updated!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="WhatsApp Customer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
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