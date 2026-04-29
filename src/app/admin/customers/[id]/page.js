"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`/api/admin/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setCustomer(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-4xl animate-bounce">👤</div>
    </div>
  );

  if (!customer) return (
    <div className="text-center py-20 text-stone-400">
      <div className="text-5xl mb-3">👤</div>
      <p className="font-semibold">Customer not found</p>
      <Link href="/admin/customers" className="btn btn-outline btn-sm mt-4">← Back</Link>
    </div>
  );

  const deliveredOrders = customer.orders.filter((o) => o.status === "delivered");
  const totalSpend = customer.totalSpend ?? 0;
  const avgOrder = deliveredOrders.length > 0 ? totalSpend / deliveredOrders.length : 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Back */}
      <Link href="/admin/customers" className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1 w-fit">
        ← Back to Customers
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 rounded-2xl p-6 text-white flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center text-2xl font-black flex-shrink-0">
          {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black">{customer.firstName} {customer.lastName}</h2>
          <p className="text-stone-300 text-sm mt-0.5">{customer.phone}</p>
          {customer.email && <p className="text-stone-400 text-xs mt-0.5">{customer.email}</p>}
        </div>
        <a
          href={`https://wa.me/${customer.phone?.replace(/\D/g, "")}?text=Hello ${customer.firstName}!`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-xl bg-green-600 hover:bg-green-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: customer.orders.length, color: "text-stone-800" },
          { label: "Delivered", value: deliveredOrders.length, color: "text-green-700" },
          { label: "Total Spend", value: `${totalSpend.toFixed(2)} QAR`, color: "text-amber-700" },
          { label: "Avg Order", value: `${avgOrder.toFixed(2)} QAR`, color: "text-blue-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Address */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-black text-stone-800 mb-3">Address</h3>
          <div className="flex flex-col gap-1.5 text-sm text-stone-600">
            {customer.city && <p><span className="text-stone-400 text-xs">City</span><br />{customer.city}</p>}
            {customer.address && <p><span className="text-stone-400 text-xs">Street</span><br />{customer.address}</p>}
            {(customer.building || customer.floor || customer.apartment) && (
              <p>
                <span className="text-stone-400 text-xs">Building / Floor / Apt</span><br />
                {[customer.building, customer.floor, customer.apartment].filter(Boolean).join(" · ")}
              </p>
            )}
            {customer.notes && <p><span className="text-stone-400 text-xs">Notes</span><br />{customer.notes}</p>}
            {!customer.city && !customer.address && <p className="text-stone-400">No address on file</p>}
          </div>
          <p className="text-xs text-stone-400 mt-4">
            Customer since {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Orders */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="font-black text-stone-800">Order History</h3>
          </div>
          {customer.orders.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {customer.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors">
                  <div>
                    <Link href={`/admin/orders/${order.id}`} className="font-black text-amber-700 text-sm hover:underline">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()} · {order.items?.length ?? 0} items
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-stone-100 text-stone-600"}`}>
                      {order.status.replace("_", " ")}
                    </span>
                    <p className="font-black text-stone-800 text-sm">{Number(order.grandTotal).toFixed(2)} QAR</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
