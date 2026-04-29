"use client";

import { useState, useEffect } from "react";

const TYPE_LABELS = {
  percentage: "% Off",
  fixed: "Fixed",
  free_delivery: "Free Delivery",
};

const TYPE_COLORS = {
  percentage: "bg-purple-100 text-purple-700 border-purple-200",
  fixed: "bg-blue-100 text-blue-700 border-blue-200",
  free_delivery: "bg-green-100 text-green-700 border-green-200",
};

const EMPTY_FORM = {
  code: "",
  type: "percentage",
  value: "",
  minOrder: "",
  maxUses: "",
  expiresAt: "",
  active: true,
};

function Toast({ msg, ok, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all ${ok ? "bg-green-600" : "bg-red-600"}`}>
      {msg}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h3 className="font-black text-stone-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 transition-colors text-stone-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function PromoForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(initial);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Code */}
      <div>
        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Code *</label>
        <input
          className="input w-full uppercase"
          value={form.code}
          onChange={(e) => set("code", e.target.value.toUpperCase())}
          placeholder="e.g. SAVE20"
          required
        />
      </div>

      {/* Type + Value row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Type *</label>
          <select className="input w-full" value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (QAR)</option>
            <option value="free_delivery">Free Delivery</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
            Value {form.type === "free_delivery" ? "(ignored)" : "*"}
          </label>
          <input
            className="input w-full"
            type="number"
            min="0"
            max={form.type === "percentage" ? "100" : undefined}
            step="0.01"
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            disabled={form.type === "free_delivery"}
            placeholder={form.type === "percentage" ? "0–100" : "Amount"}
            required={form.type !== "free_delivery"}
          />
        </div>
      </div>

      {/* Min Order + Max Uses */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Min Order (QAR)</label>
          <input
            className="input w-full"
            type="number"
            min="0"
            step="0.01"
            value={form.minOrder}
            onChange={(e) => set("minOrder", e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Max Uses</label>
          <input
            className="input w-full"
            type="number"
            min="1"
            value={form.maxUses}
            onChange={(e) => set("maxUses", e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>

      {/* Expires At */}
      <div>
        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Expires At</label>
        <input
          className="input w-full"
          type="datetime-local"
          value={form.expiresAt}
          onChange={(e) => set("expiresAt", e.target.value)}
        />
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => set("active", !form.active)}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? "bg-amber-700" : "bg-stone-300"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0"}`} />
        </div>
        <span className="text-sm font-semibold text-stone-700">Active</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full mt-2"
      >
        {submitting ? "Saving…" : "Save Promo Code"}
      </button>
    </form>
  );
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [toast, setToast] = useState(null);

  const token = () => typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setCodes(data.data);
    } catch (err) {
      console.error("Fetch promo codes error:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, ok = true) => setToast({ msg, ok });

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setCodes((prev) => [data.data, ...prev]);
        setShowCreate(false);
        showToast("Promo code created!");
      } else {
        showToast(data.message || "Failed to create", false);
      }
    } catch {
      showToast("Network error", false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (form) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/promo-codes/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setCodes((prev) => prev.map((c) => (c.id === editing.id ? data.data : c)));
        setEditing(null);
        showToast("Promo code updated!");
      } else {
        showToast(data.message || "Failed to update", false);
      }
    } catch {
      showToast("Network error", false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (promo) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ active: !promo.active }),
      });
      const data = await res.json();
      if (data.success) {
        setCodes((prev) => prev.map((c) => (c.id === promo.id ? data.data : c)));
        showToast(data.data.active ? "Activated" : "Deactivated");
      }
    } catch {
      showToast("Network error", false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/promo-codes/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setCodes((prev) => prev.filter((c) => c.id !== confirmDelete.id));
        showToast("Promo code deleted!");
      } else {
        showToast(data.message || "Failed to delete", false);
      }
    } catch {
      showToast("Network error", false);
    } finally {
      setConfirmDelete(null);
    }
  };

  const openEdit = (promo) => {
    setEditing({
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value ?? "",
      minOrder: promo.minOrder ? String(promo.minOrder) : "",
      maxUses: promo.maxUses ? String(promo.maxUses) : "",
      expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 16) : "",
      active: promo.active,
    });
  };

  const filtered = codes.filter((c) => {
    const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase()) || (c.descriptionEn || "").toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === "all" || (filterActive === "active" ? c.active : !c.active);
    return matchSearch && matchActive;
  });

  const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

  const formatValue = (promo) => {
    if (promo.type === "free_delivery") return "Free";
    if (promo.type === "percentage") return `${promo.value}%`;
    return `${Number(promo.value).toFixed(2)} QAR`;
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ─── HEADER ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Promo Codes</h2>
          <p className="text-stone-500 text-sm mt-1">{codes.length} codes total · {codes.filter((c) => c.active).length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCodes} className="btn btn-outline btn-sm flex items-center gap-1" title="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Code
          </button>
        </div>
      </div>

      {/* ─── FILTERS ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search codes or description..."
              className="input w-full pl-9"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((v) => (
              <button
                key={v}
                onClick={() => setFilterActive(v)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filterActive === v ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TABLE ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-4xl animate-bounce">🎟️</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-3">🎟️</div>
            <p className="font-semibold">No promo codes found</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 btn btn-primary btn-sm">
              Create one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Code</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Value</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Min Order</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Uses</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Expires</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((promo) => {
                  const expired = isExpired(promo.expiresAt);
                  return (
                    <tr key={promo.id} className="hover:bg-stone-50 transition-colors">

                      {/* Code */}
                      <td className="py-4 px-4">
                        <p className="font-black text-stone-800 font-mono tracking-widest text-sm">{promo.code}</p>
                        {promo.descriptionEn && (
                          <p className="text-xs text-stone-400 mt-0.5">{promo.descriptionEn}</p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${TYPE_COLORS[promo.type]}`}>
                          {TYPE_LABELS[promo.type]}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-4 px-4">
                        <p className="font-black text-stone-800 text-sm">{formatValue(promo)}</p>
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-4">
                        <p className="text-sm text-stone-600">
                          {promo.minOrder ? `${Number(promo.minOrder).toFixed(2)} QAR` : "—"}
                        </p>
                      </td>

                      {/* Uses */}
                      <td className="py-4 px-4">
                        <p className="text-sm text-stone-600">
                          {promo.usedCount ?? 0}
                          {promo.maxUses ? ` / ${promo.maxUses}` : ""}
                        </p>
                        {promo.maxUses && (
                          <div className="w-16 h-1 bg-stone-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, ((promo.usedCount ?? 0) / promo.maxUses) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Expires */}
                      <td className="py-4 px-4">
                        {promo.expiresAt ? (
                          <span className={`text-xs font-semibold ${expired ? "text-red-500" : "text-stone-500"}`}>
                            {expired ? "Expired " : ""}{new Date(promo.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">Never</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggle(promo)}
                          className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${promo.active && !expired ? "bg-amber-700" : "bg-stone-300"}`}
                          title={promo.active ? "Click to deactivate" : "Click to activate"}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${promo.active && !expired ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(promo)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmDelete(promo)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

      {/* ─── CREATE MODAL ─────────────────────────── */}
      {showCreate && (
        <Modal title="New Promo Code" onClose={() => setShowCreate(false)}>
          <PromoForm initial={EMPTY_FORM} onSubmit={handleCreate} submitting={submitting} />
        </Modal>
      )}

      {/* ─── EDIT MODAL ─────────────────────────── */}
      {editing && (
        <Modal title="Edit Promo Code" onClose={() => setEditing(null)}>
          <PromoForm initial={editing} onSubmit={handleEdit} submitting={submitting} />
        </Modal>
      )}

      {/* ─── DELETE CONFIRM ─────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-black text-stone-800 text-lg mb-2">Delete Promo Code?</h3>
            <p className="text-stone-500 text-sm mb-6">
              Are you sure you want to delete <span className="font-mono font-bold text-stone-800">{confirmDelete.code}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST ─────────────────────────── */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}
    </div>
  );
}
