"use client";

import { useState } from "react";

// ─── ADD ADMIN FORM ───────────────────────────────────────────────────────────
function AddAdminCard() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password !== form.confirm) {
      setMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (form.password.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `Admin "${form.name}" created successfully` });
        setForm({ name: "", email: "", password: "", confirm: "" });
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
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-base">👤</div>
        <div>
          <h3 className="font-black text-stone-800 text-sm">Add New Admin</h3>
          <p className="text-xs text-stone-400">Create a new admin account</p>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          name="name" value={form.name} onChange={handle} required
          placeholder="Full name"
          className="input text-sm"
        />
        <input
          name="email" type="email" value={form.email} onChange={handle} required
          placeholder="Email address"
          className="input text-sm"
        />
        <input
          name="password" type="password" value={form.password} onChange={handle} required
          placeholder="Password (min 8 chars)"
          className="input text-sm"
        />
        <input
          name="confirm" type="password" value={form.confirm} onChange={handle} required
          placeholder="Confirm password"
          className="input text-sm"
        />
        {msg && (
          <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm justify-center mt-1 disabled:opacity-50">
          {loading ? "Creating…" : "Create Admin"}
        </button>
      </form>
    </div>
  );
}

// ─── CHANGE PASSWORD FORM ─────────────────────────────────────────────────────
function ChangePasswordCard() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.next !== form.confirm) {
      setMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (form.next.length < 8) {
      setMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/admin/admins/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-base">🔑</div>
        <div>
          <h3 className="font-black text-stone-800 text-sm">Change My Password</h3>
          <p className="text-xs text-stone-400">Update your current password</p>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          name="current" type="password" value={form.current} onChange={handle} required
          placeholder="Current password"
          className="input text-sm"
        />
        <input
          name="next" type="password" value={form.next} onChange={handle} required
          placeholder="New password (min 8 chars)"
          className="input text-sm"
        />
        <input
          name="confirm" type="password" value={form.confirm} onChange={handle} required
          placeholder="Confirm new password"
          className="input text-sm"
        />
        {msg && (
          <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm justify-center mt-1 disabled:opacity-50">
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CredentialsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-black tracking-tight">Admin Credentials</h2>
        <p className="text-stone-400 text-sm mt-1">Manage admin accounts and passwords</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AddAdminCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
