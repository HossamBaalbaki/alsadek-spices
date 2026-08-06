"use client";

import { useState, useEffect, useCallback } from "react";

const LOGO = "https://pub-233449cd95484981a46fd69460d65453.r2.dev/branding/alsadeq-logo-nobg.png";

function token() { return localStorage.getItem("adminToken") || ""; }

// ─── ADMINS TABLE ─────────────────────────────────────────────────────────────
function AdminsTable({ refresh, onRefresh }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [currentEmail, setCurrentEmail] = useState("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setAdmins(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    const user = localStorage.getItem("adminUser");
    if (user) setCurrentEmail(JSON.parse(user).email);
  }, [fetchAdmins, refresh]);

  const handleDelete = async (admin) => {
    if (!confirm(`Remove admin "${admin.name}"? This cannot be undone.`)) return;
    setDeleting(admin.id);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id: admin.id }),
      });
      const data = await res.json();
      if (data.success) { onRefresh(); fetchAdmins(); }
      else alert(data.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
      <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-stone-400">Loading admins…</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h3 className="font-black text-stone-800">Admin Users</h3>
          <p className="text-xs text-stone-400 mt-0.5">{admins.length} account{admins.length !== 1 ? "s" : ""} total</p>
        </div>
        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
          {admins.length} total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="text-left px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {admins.map((admin) => {
              const isSelf = admin.email === currentEmail;
              return (
                <tr key={admin.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-stone-800">{admin.name}</span>
                      {isSelf && (
                        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-600">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                      {admin.role || "admin"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-400 text-xs">
                    {new Date(admin.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(admin)}
                        disabled={deleting === admin.id}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                      >
                        {deleting === admin.id ? "Removing…" : "Remove"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADD ADMIN FORM ───────────────────────────────────────────────────────────
function AddAdminForm({ onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [show, setShow] = useState({ password: false, confirm: false });

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password !== form.confirm) return setMsg({ type: "error", text: "Passwords do not match" });
    if (form.password.length < 8) return setMsg({ type: "error", text: "Password must be at least 8 characters" });
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `"${form.name}" added successfully` });
        setForm({ name: "", email: "", password: "", confirm: "" });
        onSuccess();
      } else {
        setMsg({ type: "error", text: data.message || "Failed to create admin" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <h3 className="font-black text-stone-800">Add New Admin</h3>
          <p className="text-xs text-stone-400">Create a new admin account</p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">Full Name</label>
          <input name="name" value={form.name} onChange={handle} required placeholder="e.g. Ahmad Al Sadeq" className="input w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handle} required placeholder="admin@alsadeq.qa" className="input w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">Password</label>
          <div className="relative">
            <input name="password" type={show.password ? "text" : "password"} value={form.password} onChange={handle} required placeholder="Min 8 characters" className="input w-full text-sm pr-10" />
            <button type="button" onClick={() => setShow((s) => ({ ...s, password: !s.password }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={show.password ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">Confirm Password</label>
          <div className="relative">
            <input name="confirm" type={show.confirm ? "text" : "password"} value={form.confirm} onChange={handle} required placeholder="Repeat password" className="input w-full text-sm pr-10" />
            <button type="button" onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={show.confirm ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
              </svg>
            </button>
          </div>
        </div>

        {msg && (
          <p className={`text-xs font-semibold px-3 py-2.5 rounded-xl ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {msg.text}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary justify-center mt-1 disabled:opacity-50">
          {loading ? "Creating…" : "Create Admin"}
        </button>
      </form>
    </div>
  );
}

// ─── CHANGE PASSWORD FORM ─────────────────────────────────────────────────────
function ChangePasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.next !== form.confirm) return setMsg({ type: "error", text: "New passwords do not match" });
    if (form.next.length < 8) return setMsg({ type: "error", text: "New password must be at least 8 characters" });
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: "Password updated successfully" });
        setForm({ current: "", next: "", confirm: "" });
      } else {
        setMsg({ type: "error", text: data.message || "Failed to update password" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  };

  const eyeIcon = (visible) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={visible ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
    </svg>
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <div>
          <h3 className="font-black text-stone-800">Change My Password</h3>
          <p className="text-xs text-stone-400">Update your current password</p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {[
          { name: "current", label: "Current Password", placeholder: "Your current password", key: "current" },
          { name: "next",    label: "New Password",     placeholder: "Min 8 characters",      key: "next" },
          { name: "confirm", label: "Confirm New Password", placeholder: "Repeat new password", key: "confirm" },
        ].map(({ name, label, placeholder, key }) => (
          <div key={name}>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">{label}</label>
            <div className="relative">
              <input
                name={name} type={show[key] ? "text" : "password"}
                value={form[name]} onChange={handle} required
                placeholder={placeholder} className="input w-full text-sm pr-10"
              />
              <button type="button" onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {eyeIcon(show[key])}
              </button>
            </div>
          </div>
        ))}

        {msg && (
          <p className={`text-xs font-semibold px-3 py-2.5 rounded-xl ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {msg.text}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary justify-center mt-1 disabled:opacity-50">
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CredentialsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Admin Credentials</h2>
          <p className="text-stone-400 text-sm mt-0.5">Manage admin accounts and passwords</p>
        </div>
      </div>

      {/* Admins Table */}
      <AdminsTable refresh={refreshKey} onRefresh={refresh} />

      {/* Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AddAdminForm onSuccess={refresh} />
        <ChangePasswordForm />
      </div>

    </div>
  );
}
