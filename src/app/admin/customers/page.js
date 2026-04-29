"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    } catch (error) {
      console.error("Fetch customers error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(s) ||
      customer.lastName?.toLowerCase().includes(s) ||
      customer.phone?.includes(s) ||
      customer.email?.toLowerCase().includes(s) ||
      customer.city?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex flex-col gap-6">

      {/* ─── HEADER ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Customers</h2>
          <p className="text-stone-500 text-sm mt-1">
            {filteredCustomers.length} customers found
          </p>
        </div>
      </div>

      {/* ─── STATS ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: customers.length, icon: "👥" },
          { label: "With Orders", value: customers.filter((c) => c._count?.orders > 0).length, icon: "📦" },
          { label: "New This Month", value: customers.filter((c) => {
            const date = new Date(c.createdAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length, icon: "🆕" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-black text-stone-800">{stat.value}</p>
            <p className="text-sm text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── SEARCH ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, city..."
            className="input w-full pl-9"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* ─── CUSTOMERS TABLE ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-4xl animate-bounce">👥</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-3">👤</div>
            <p className="font-semibold">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">City</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Orders</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Joined</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-700 font-black text-sm">
                            {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <Link href={`/admin/customers/${customer.id}`} className="font-bold text-amber-700 text-sm hover:underline">
                            {customer.firstName} {customer.lastName}
                          </Link>
                          <p className="text-xs text-stone-400">ID: {customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-stone-700 font-medium">
                        {customer.phone}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-stone-500">
                        {customer.email || "—"}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-stone-600">
                        {customer.city || "—"}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        customer._count?.orders > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-100 text-stone-500"
                      }`}>
                        {customer._count?.orders || 0} orders
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs text-stone-400">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${customer.phone?.replace(/\D/g, "")}?text=Hello ${customer.firstName}!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="WhatsApp"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                        <a
                          href={`tel:${customer.phone}`}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Call"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
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