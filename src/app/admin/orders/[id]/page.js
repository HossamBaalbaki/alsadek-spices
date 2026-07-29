"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:          { label: "Pending",          color: "bg-yellow-100 text-yellow-700 border-yellow-200",  dot: "bg-yellow-400" },
  confirmed:        { label: "Confirmed",         color: "bg-blue-100 text-blue-700 border-blue-200",        dot: "bg-blue-400" },
  preparing:        { label: "Preparing",         color: "bg-purple-100 text-purple-700 border-purple-200",  dot: "bg-purple-400" },
  out_for_delivery: { label: "Out for Delivery",  color: "bg-orange-100 text-orange-700 border-orange-200",  dot: "bg-orange-400" },
  delivered:        { label: "Delivered",         color: "bg-green-100 text-green-700 border-green-200",     dot: "bg-green-500" },
  cancelled:        { label: "Cancelled",         color: "bg-red-100 text-red-700 border-red-200",           dot: "bg-red-400" },
};

const PAYMENT_META = {
  pending: { label: "Unpaid",  color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  paid:    { label: "Paid",    color: "text-green-700 bg-green-50 border-green-200" },
  failed:  { label: "Failed",  color: "text-red-700 bg-red-50 border-red-200" },
};

const STATUS_FLOW = [
  "pending", "confirmed", "preparing", "out_for_delivery", "delivered",
];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: "bg-stone-100 text-stone-600 border-stone-200", dot: "bg-stone-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function formatGrams(g) {
  const n = Number(g) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} t`;
  if (n >= 1000)      return `${(n / 1000).toFixed(2)} kg`;
  return `${n.toFixed(0)} g`;
}

function fmt(n) {
  return Number(n || 0).toFixed(2);
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl text-white ${type === "error" ? "bg-red-600" : "bg-green-600"}`}>
      {msg}
    </div>
  );
}

// ─── THERMAL RECEIPT COMPONENT ───────────────────────────────────────────────
function ThermalReceipt({ order, onClose }) {
  const fmtN = (n) => Number(n || 0).toFixed(2);
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
  const c = order.customer || {};
  const addressParts = [
    c.address,
    c.building  && `Bldg: ${c.building}`,
    c.floor     && `Floor: ${c.floor}`,
    c.apartment && `Apt: ${c.apartment}`,
    c.city,
  ].filter(Boolean);

  const statusLabel = { pending:"Pending", confirmed:"Confirmed", preparing:"Preparing", out_for_delivery:"Out for Delivery", delivered:"Delivered ✓", cancelled:"Cancelled ✗" };
  const payLabel    = { pending:"Unpaid", paid:"Paid ✓", failed:"Failed ✗" };
  const isPaid      = order.paymentStatus === "paid";

  const handlePrint = () => {
    const el = document.getElementById("thermal-receipt-content");
    if (!el) return;
    const printWindow = window.open("", "_blank", "width=480,height=800");
    if (!printWindow) { alert("Allow popups to print."); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Receipt ${order.orderNumber}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Courier New',Courier,monospace; font-size:11px; color:#111; background:#fff; width:72mm; }
</style>
</head><body>${el.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 800);
  };

  const R = { fontFamily: "'Courier New', Courier, monospace", color: "#111" };
  const divider = <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />;
  const dividerSolid = <div style={{ borderTop: "2px solid #111", margin: "8px 0" }} />;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      {/* Modal shell */}
      <div style={{ background:"#f0f0f0", borderRadius:"16px", width:"100%", maxWidth:"520px", maxHeight:"95vh", display:"flex", flexDirection:"column", boxShadow:"0 25px 60px rgba(0,0,0,0.5)" }}>

        {/* Toolbar */}
        <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #ddd" }}>
          <span style={{ fontWeight:700, fontSize:"14px", color:"#333" }}>🖨️ Receipt Preview</span>
          <div style={{ display:"flex", gap:"10px" }}>
            <button onClick={handlePrint} style={{ background:"#1a1a1a", color:"#fff", border:"none", padding:"8px 20px", borderRadius:"8px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>
              Print / Save PDF
            </button>
            <button onClick={onClose} style={{ background:"#e5e5e5", border:"none", padding:"8px 14px", borderRadius:"8px", fontWeight:700, fontSize:"13px", cursor:"pointer", color:"#555" }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Receipt scroll area */}
        <div style={{ overflowY:"auto", padding:"24px", display:"flex", justifyContent:"center" }}>
          {/* Paper */}
          <div
            id="thermal-receipt-content"
            style={{
              ...R,
              background:"#fff",
              width:"320px",
              padding:"18px 16px 24px",
              boxShadow:"0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)",
              borderRadius:"2px",
              position:"relative",
            }}
          >
            {/* Torn-edge top */}
            <div style={{ position:"absolute", top:"-8px", left:0, right:0, height:"8px", background:"repeating-linear-gradient(90deg,#f0f0f0 0px,#f0f0f0 8px,transparent 8px,transparent 12px)", borderRadius:"2px 2px 0 0" }} />

            {/* ── HEADER ── */}
            <div style={{ textAlign:"center", paddingBottom:"10px" }}>
              <img
                src="https://res.cloudinary.com/dltz3gpiy/image/upload/q_auto,f_png,w_300/branding/alsadeq-logo-nobg"
                alt="Al Sadeq Spices"
                style={{ width:"100px", height:"100px", objectFit:"contain", margin:"0 auto 4px" }}
              />
              <div style={{ fontSize:"10px", color:"#777", marginTop:"2px" }}>Premium Spices · Qatar</div>
            </div>

            {dividerSolid}

            {/* ── ORDER INFO ── */}
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
              <tbody>
                <tr>
                  <td style={{ color:"#888", fontSize:"9px", textTransform:"uppercase", letterSpacing:"1px", paddingBottom:"1px" }}>Receipt #</td>
                  <td style={{ textAlign:"right", color:"#888", fontSize:"9px", textTransform:"uppercase", letterSpacing:"1px" }}>Date</td>
                </tr>
                <tr>
                  <td style={{ fontWeight:900, fontSize:"14px", letterSpacing:"1px" }}>{order.orderNumber}</td>
                  <td style={{ textAlign:"right", fontWeight:700 }}>{dateStr}</td>
                </tr>
                <tr>
                  <td style={{ color:"#888", fontSize:"9px", textTransform:"uppercase", letterSpacing:"1px", paddingTop:"4px" }}>Status</td>
                  <td style={{ textAlign:"right", color:"#666" }}>{timeStr}</td>
                </tr>
                <tr>
                  <td style={{ paddingTop:"3px" }}>
                    <span style={{ border:"1.5px solid #111", padding:"1px 7px", fontSize:"10px", borderRadius:"3px", fontWeight:700 }}>
                      {statusLabel[order.status] || order.status}
                    </span>
                    <span style={{ border:`1.5px solid ${isPaid?"#16a34a":"#dc2626"}`, color:isPaid?"#16a34a":"#dc2626", padding:"1px 7px", fontSize:"10px", borderRadius:"3px", fontWeight:700, marginLeft:"5px" }}>
                      {payLabel[order.paymentStatus] || order.paymentStatus}
                    </span>
                  </td>
                  <td style={{ textAlign:"right", fontWeight:700, textTransform:"capitalize", fontSize:"11px" }}>{order.paymentMethod || "cash"}</td>
                </tr>
              </tbody>
            </table>

            {divider}

            {/* ── CUSTOMER ── */}
            <div style={{ fontSize:"9px", color:"#888", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>Customer</div>
            <div style={{ fontWeight:700, fontSize:"13px" }}>{c.firstName} {c.lastName}</div>
            <div style={{ fontSize:"11px", marginTop:"1px" }}>{c.phone}</div>
            {addressParts.length > 0 && (
              <div style={{ fontSize:"10px", color:"#555", marginTop:"3px", lineHeight:"1.5" }}>
                {addressParts.join("  ·  ")}
              </div>
            )}
            {order.deliveryZone && (
              <div style={{ fontSize:"10px", marginTop:"2px" }}>
                <span style={{ color:"#888" }}>Zone: </span><span style={{ fontWeight:700 }}>{order.deliveryZone}</span>
              </div>
            )}

            {divider}

            {/* ── ITEMS ── */}
            <div style={{ fontSize:"9px", color:"#888", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>
              Items ({(order.items || []).length})
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <tbody>
                {(order.items || []).map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding:"5px 0", borderBottom:"1px dashed #ddd", verticalAlign:"top" }}>
                      <div style={{ fontWeight:700, fontSize:"12px" }}>{item.nameEn}</div>
                      <div style={{ fontSize:"10px", color:"#666", marginTop:"1px" }}>
                        {[item.weight, item.quantity > 1 && `x${item.quantity}`, `@ ${fmtN(item.price)} QAR`].filter(Boolean).join("  ")}
                      </div>
                    </td>
                    <td style={{ padding:"5px 0", borderBottom:"1px dashed #ddd", textAlign:"right", fontWeight:700, fontSize:"12px", whiteSpace:"nowrap", verticalAlign:"top" }}>
                      {fmtN(item.price * item.quantity)}<br/>
                      <span style={{ fontWeight:400, fontSize:"9px", color:"#888" }}>QAR</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── TOTALS ── */}
            <table style={{ width:"100%", borderCollapse:"collapse", marginTop:"8px", fontSize:"11px" }}>
              <tbody>
                <tr>
                  <td style={{ color:"#666", padding:"2px 0" }}>Subtotal</td>
                  <td style={{ textAlign:"right", color:"#666", padding:"2px 0" }}>{fmtN(order.subtotal)} QAR</td>
                </tr>
                {Number(order.deliveryFee) > 0 && (
                  <tr>
                    <td style={{ color:"#666", padding:"2px 0" }}>Delivery{order.deliveryZone ? ` (${order.deliveryZone})` : ""}</td>
                    <td style={{ textAlign:"right", color:"#666", padding:"2px 0" }}>+ {fmtN(order.deliveryFee)} QAR</td>
                  </tr>
                )}
                {Number(order.discountAmount) > 0 && (
                  <tr>
                    <td style={{ color:"#16a34a", padding:"2px 0" }}>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</td>
                    <td style={{ textAlign:"right", color:"#16a34a", padding:"2px 0" }}>− {fmtN(order.discountAmount)} QAR</td>
                  </tr>
                )}
              </tbody>
            </table>

            {dividerSolid}

            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight:900, fontSize:"20px", letterSpacing:"1px" }}>TOTAL</td>
                  <td style={{ textAlign:"right", fontWeight:900, fontSize:"20px" }}>{fmtN(order.grandTotal)} <span style={{ fontSize:"13px" }}>QAR</span></td>
                </tr>
              </tbody>
            </table>

            {divider}

            {/* ── PROMO ── */}
            {order.promoCode && (
              <>
                <div style={{ textAlign:"center", padding:"4px 0" }}>
                  <div style={{ fontSize:"9px", color:"#888", textTransform:"uppercase", letterSpacing:"1px" }}>Promo Applied</div>
                  <div style={{ fontWeight:900, fontSize:"15px", letterSpacing:"3px", marginTop:"2px" }}>{order.promoCode}</div>
                  <div style={{ fontSize:"10px", color:"#16a34a", marginTop:"1px" }}>You saved {fmtN(order.discountAmount)} QAR</div>
                </div>
                {divider}
              </>
            )}

            {/* ── NOTES ── */}
            {order.notes && (
              <>
                <div style={{ fontSize:"9px", color:"#888", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"3px" }}>Notes</div>
                <div style={{ fontSize:"11px", fontStyle:"italic", color:"#555" }}>{order.notes}</div>
                {divider}
              </>
            )}

            {/* ── TRACKING ── */}
            <div style={{ textAlign:"center", padding:"6px 0" }}>
              <div style={{ fontSize:"9px", color:"#888", textTransform:"uppercase", letterSpacing:"1px" }}>Track your order at</div>
              <div style={{ fontWeight:700, fontSize:"12px", marginTop:"2px" }}>alsadek.com/track</div>
              <div style={{ fontFamily:"'Courier New',monospace", letterSpacing:"4px", fontSize:"15px", fontWeight:900, background:"#f5f5f5", border:"1px solid #ddd", borderRadius:"4px", padding:"8px 6px", marginTop:"8px", wordBreak:"break-all" }}>
                {order.orderNumber}
              </div>
            </div>

            {divider}

            {/* ── FOOTER ── */}
            <div style={{ textAlign:"center", paddingTop:"4px" }}>
              <div style={{ fontSize:"16px", fontWeight:900 }}>Thank you! 🌶️</div>
              <div style={{ fontSize:"14px", fontWeight:700, marginTop:"2px", direction:"rtl" }}>شكراً لتسوقكم معنا</div>
              <div style={{ fontSize:"9px", color:"#888", marginTop:"6px" }}>Al Sadeq Spices · Qatar</div>
              <div style={{ fontSize:"9px", color:"#bbb", marginTop:"2px" }}>Printed: {dateStr} {timeStr}</div>
            </div>

            {/* Torn-edge bottom */}
            <div style={{ position:"absolute", bottom:"-8px", left:0, right:0, height:"8px", background:"repeating-linear-gradient(90deg,#f0f0f0 0px,#f0f0f0 8px,transparent 8px,transparent 12px)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null); // newStatus string
  const [showPaidChoice, setShowPaidChoice] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrder(data.data);
      else showToast("Order not found", "error");
    } catch {
      showToast("Failed to load order", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        showToast(`Status updated to ${STATUS_META[newStatus]?.label || newStatus}`);
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdating(false);
    }
  };

  const updatePayment = async (paymentStatus, paymentMethod) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus, ...(paymentMethod && { paymentMethod }) }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setShowPaidChoice(false);
        showToast(
          paymentMethod
            ? `Marked as Paid — ${paymentMethod === "card" ? "Card" : "Cash"}`
            : "Payment status updated"
        );
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-5xl animate-bounce">📦</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">❓</div>
        <p className="text-stone-500 mb-4">Order not found</p>
        <Link href="/admin/orders" className="btn btn-outline btn-sm">← Back to Orders</Link>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const whatsapp = `https://wa.me/${order.customer?.phone?.replace(/\D/g, "")}`;

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />
      {showReceipt && <ThermalReceipt order={order} onClose={() => setShowReceipt(false)} />}

      {/* ─── STATUS CONFIRMATION MODAL ─── */}
      {confirmStatus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-stone-800 mb-2">Confirm Status Change</h3>
            <p className="text-sm text-stone-600 mb-6">
              {confirmStatus === "cancelled"
                ? "Cancel this order? Stock will be restored and this cannot be undone."
                : `Change status to "${STATUS_META[confirmStatus]?.label}"?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmStatus(null)} className="btn btn-outline flex-1">
                Go Back
              </button>
              <button
                onClick={async () => { const s = confirmStatus; setConfirmStatus(null); await updateStatus(s); }}
                disabled={updating}
                className={`btn flex-1 text-white border-0 ${confirmStatus === "cancelled" ? "bg-red-600 hover:bg-red-700" : "bg-amber-700 hover:bg-amber-800"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 max-w-5xl mx-auto">

        {/* ─── BREADCRUMB + ACTIONS ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin/orders" className="text-stone-400 hover:text-stone-700 transition-colors">
              Orders
            </Link>
            <span className="text-stone-300">/</span>
            <span className="font-bold text-stone-800">{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReceipt(true)}
              className="btn btn-outline btn-sm"
            >
              🖨️ Print Receipt
            </button>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm bg-[#25D366] hover:bg-[#1DB857] text-white border-0"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* ─── ORDER HEADER ─── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-black text-stone-800">{order.orderNumber}</h2>
                <StatusBadge status={order.status} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PAYMENT_META[order.paymentStatus]?.color || "bg-stone-50 text-stone-500 border-stone-200"}`}>
                  {PAYMENT_META[order.paymentStatus]?.label || order.paymentStatus}
                </span>
              </div>
              <p className="text-sm text-stone-400">
                Placed on {new Date(order.createdAt).toLocaleDateString("en", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })} at {new Date(order.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {order.promoCode && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 inline-block mt-2">
                  🎟️ Promo: {order.promoCode}
                </p>
              )}
            </div>

            {/* Payment method */}
            <div className="text-right">
              <p className="text-xs text-stone-400 mb-1">Payment Method</p>
              <p className="font-bold text-stone-700 capitalize">
                {order.paymentMethod === "card" ? "💳" : "💵"} {order.paymentMethod}
              </p>
            </div>
          </div>

          {/* ─── STATUS STEPPER ─── */}
          {!isCancelled && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <div className="flex items-center justify-between">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= currentIdx;
                  const active = i === currentIdx;
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center relative">
                      {/* Connector line */}
                      {i > 0 && (
                        <div className={`absolute left-0 top-4 w-full h-0.5 -translate-x-1/2 ${i <= currentIdx ? "bg-amber-500" : "bg-stone-200"}`} />
                      )}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                        active ? "bg-amber-600 border-amber-600 text-white shadow-lg" :
                        done   ? "bg-amber-100 border-amber-400 text-amber-700" :
                                 "bg-white border-stone-200 text-stone-400"
                      }`}>
                        {done && !active ? "✓" : i + 1}
                      </div>
                      <p className={`text-[10px] font-semibold mt-1 text-center leading-tight ${active ? "text-amber-700" : done ? "text-stone-600" : "text-stone-400"}`}>
                        {STATUS_META[s]?.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-semibold text-center">
                ❌ This order was cancelled{order.stockRestored ? " — stock has been restored" : ""}
              </div>
            </div>
          )}
        </div>

        {/* ─── 2-COL GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── LEFT: Items + Totals ─── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="font-black text-stone-800 mb-4 text-sm">
                Order Items ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-stone-100">
                {order.items?.map((item) => {
                  const image = item.product?.images?.[0]?.trim() || null;
                  return (
                    <div key={item.id} className="flex items-center gap-4 py-4">
                      {/* Image */}
                      <div className="w-14 h-14 rounded-xl bg-amber-50 border border-stone-100 flex-shrink-0 overflow-hidden relative">
                        {image ? (
                          <Image src={image} alt={item.nameEn} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🌶️</div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-800 text-sm truncate">{item.nameEn}</p>
                        <p className="text-stone-400 text-xs">{item.nameAr}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {item.weight && <span className="text-xs text-stone-500 bg-stone-50 border border-stone-100 rounded px-2 py-0.5">{item.weight}</span>}
                          {item.grams > 0 && <span className="text-xs text-stone-400">{formatGrams(item.grams)} × {item.quantity}</span>}
                          <span className="text-xs font-semibold capitalize text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{item.type}</span>
                        </div>
                      </div>
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-stone-800 text-sm">{fmt(item.price * item.quantity)} QAR</p>
                        <p className="text-xs text-stone-400">{fmt(item.price)} × {item.quantity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-stone-100 mt-2 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Subtotal</span><span>{fmt(order.subtotal)} QAR</span>
                </div>
                {Number(order.deliveryFee) > 0 && (
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Delivery Fee{order.deliveryZone ? ` (${order.deliveryZone})` : ""}</span>
                    <span>{fmt(order.deliveryFee)} QAR</span>
                  </div>
                )}
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                    <span>− {fmt(order.discountAmount)} QAR</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-stone-900 text-base pt-2 border-t border-stone-100">
                  <span>Grand Total</span>
                  <span className="text-amber-700">{fmt(order.grandTotal)} QAR</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Order Notes</p>
                <p className="text-sm text-stone-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* ─── RIGHT: Customer + Actions ─── */}
          <div className="flex flex-col gap-6">

            {/* Customer */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="font-black text-stone-800 mb-4 text-sm">Customer</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-700 flex-shrink-0">
                  {order.customer?.firstName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <a href={`tel:${order.customer?.phone}`} className="text-xs text-amber-700 hover:underline">
                    {order.customer?.phone}
                  </a>
                </div>
              </div>

              {(order.customer?.address || order.customer?.building) && (
                <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 space-y-1">
                  {order.customer.address && <p>📍 {order.customer.address}</p>}
                  {order.customer.building && <p>🏢 Building: {order.customer.building}</p>}
                  {order.customer.floor && <p>🪜 Floor: {order.customer.floor}</p>}
                  {order.customer.apartment && <p>🚪 Apt: {order.customer.apartment}</p>}
                  {order.customer.city && <p>🏙️ {order.customer.city}</p>}
                </div>
              )}

              {order.customer?.notes && (
                <p className="text-xs text-stone-500 mt-3 italic">"{order.customer.notes}"</p>
              )}
            </div>

            {/* Update Status */}
            {!isCancelled && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <h3 className="font-black text-stone-800 mb-4 text-sm">Update Status</h3>
                <div className="flex flex-col gap-2">
                  {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => setConfirmStatus(s)}
                      disabled={updating}
                      className="w-full text-left px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-amber-50 hover:border-amber-300 transition-all disabled:opacity-50"
                    >
                      → {STATUS_META[s]?.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setConfirmStatus("cancelled")}
                    disabled={updating}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 mt-2"
                  >
                    ❌ Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* Payment Status */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="font-black text-stone-800 mb-4 text-sm">Payment</h3>
              <div className="flex flex-col gap-2">
                {showPaidChoice ? (
                  <>
                    <p className="text-xs font-semibold text-stone-500 mb-1">How did the customer pay?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updatePayment("paid", "cash")}
                        disabled={updating}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-green-200 text-sm font-semibold text-green-700 hover:bg-green-50 transition-all disabled:opacity-50"
                      >
                        💵 Cash
                      </button>
                      <button
                        onClick={() => updatePayment("paid", "card")}
                        disabled={updating}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-green-200 text-sm font-semibold text-green-700 hover:bg-green-50 transition-all disabled:opacity-50"
                      >
                        💳 Card
                      </button>
                    </div>
                    <button
                      onClick={() => setShowPaidChoice(false)}
                      disabled={updating}
                      className="w-full px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-600 transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {order.paymentStatus !== "paid" && (
                      <button
                        onClick={() => setShowPaidChoice(true)}
                        disabled={updating}
                        className="w-full px-4 py-2.5 rounded-xl border border-green-200 text-sm font-semibold text-green-700 hover:bg-green-50 transition-all disabled:opacity-50"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {["pending", "failed"].filter((s) => s !== order.paymentStatus).map((s) => (
                      <button
                        key={s}
                        onClick={() => updatePayment(s)}
                        disabled={updating}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
                          s === "failed" ? "border-red-200 text-red-600 hover:bg-red-50" :
                                           "border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        Mark as {PAYMENT_META[s]?.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
