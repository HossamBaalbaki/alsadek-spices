"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    nameEn: "",
    nameAr: "",
    slug: "",
    descriptionEn: "",
    descriptionAr: "",
    icon: "",
    image: "",
    sortOrder: 0,
    active: true,
  };
  const [form, setForm] = useState(emptyForm);

  // ─── FETCH CATEGORIES ───────────────────────────
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
      else setError(data.message || "Failed to load categories");
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ─── HELPERS ───────────────────────────
  const slugify = (str) =>
    String(str)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleNameEnChange = (value) => {
    setForm((prev) => ({
      ...prev,
      nameEn: value,
      slug: editing ? prev.slug : slugify(value),
    }));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      nameEn: cat.nameEn || "",
      nameAr: cat.nameAr || "",
      slug: cat.slug || "",
      descriptionEn: cat.descriptionEn || "",
      descriptionAr: cat.descriptionAr || "",
      icon: cat.icon || "",
      image: cat.image || "",
      sortOrder: cat.sortOrder || 0,
      active: cat.active !== false,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  // ─── SUBMIT ───────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        slug: slugify(form.slug || form.nameEn),
        sortOrder: Number(form.sortOrder) || 0,
      };

      const url = editing
        ? `/api/admin/categories/${editing.id}`
        : "/api/admin/categories";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(editing ? "Category updated!" : "Category created!");
        closeForm();
        fetchCategories();
      } else {
        setError(data.message || "Failed to save category");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── DELETE ───────────────────────────
  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.nameEn}"?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Category deleted");
        fetchCategories();
      } else {
        setError(data.message || "Failed to delete category");
      }
    } catch (err) {
      setError("Failed to delete category");
    }
  };

  // ─── TOGGLE ACTIVE ───────────────────────────
  const toggleActive = async (cat) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !cat.active }),
      });
      const data = await res.json();
      if (data.success) fetchCategories();
      else setError(data.message || "Failed to update");
    } catch (err) {
      setError("Failed to update");
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Categories</h2>
          <p className="text-stone-500 text-sm mt-1">
            Manage product categories shown across the store
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-sm transition-colors"
          >
            ← Dashboard
          </Link>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800 transition-colors"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-semibold text-sm">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-semibold text-sm">
          ✅ {success}
        </div>
      )}

      {/* LIST */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-stone-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-stone-500">
            No categories yet. Click <span className="font-bold">+ Add Category</span>.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr className="text-left text-stone-600">
                <th className="px-4 py-3 font-bold">#</th>
                <th className="px-4 py-3 font-bold">Icon</th>
                <th className="px-4 py-3 font-bold">Name (EN)</th>
                <th className="px-4 py-3 font-bold">Name (AR)</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold text-center">Products</th>
                <th className="px-4 py-3 font-bold text-center">Sort</th>
                <th className="px-4 py-3 font-bold text-center">Active</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-4 py-3 text-stone-400">{idx + 1}</td>
                  <td className="px-4 py-3 text-2xl">{cat.icon || "🏷️"}</td>
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {cat.nameEn}
                  </td>
                  <td className="px-4 py-3 text-stone-700" dir="rtl">
                    {cat.nameAr}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                      {cat.productCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-stone-600">
                    {cat.sortOrder}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        cat.active
                          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          : "bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200"
                      }`}
                    >
                      {cat.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-100 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <h3 className="text-lg font-black text-stone-800">
                {editing ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={form.nameEn}
                    onChange={(e) => handleNameEnChange(e.target.value)}
                    placeholder="e.g. Arabic Spices"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Name (Arabic) *
                  </label>
                  <input
                    type="text"
                    value={form.nameAr}
                    onChange={(e) => handleChange("nameAr", e.target.value)}
                    placeholder="مثال: بهارات عربية"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm text-right"
                    dir="rtl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="e.g. arabic-spices"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm font-mono"
                  required
                />
                <p className="text-xs text-stone-400 mt-1">
                  Used as filter on shop URL: /shop?category={form.slug || "..."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={(e) => handleChange("descriptionEn", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    value={form.descriptionAr}
                    onChange={(e) => handleChange("descriptionAr", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm resize-none text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => handleChange("icon", e.target.value)}
                    placeholder="🌶️"
                    maxLength={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => handleChange("sortOrder", e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Status
                  </label>
                  <label
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      form.active
                        ? "border-amber-400 bg-amber-50"
                        : "border-stone-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => handleChange("active", e.target.checked)}
                      className="w-4 h-4 accent-amber-700"
                    />
                    <span className="text-sm font-semibold text-stone-700">
                      {form.active ? "Active" : "Inactive"}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => handleChange("image", e.target.value)}
                  placeholder="https://example.com/category.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-400 text-sm"
                />
                {form.image && (
                  <img
                    src={form.image}
                    alt="preview"
                    className="mt-2 w-20 h-20 rounded-lg object-cover border border-stone-200"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
              </div>

              <div className="flex items-center gap-3 justify-end pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2.5 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Saving..."
                    : editing
                    ? "💾 Save Changes"
                    : "✅ Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
