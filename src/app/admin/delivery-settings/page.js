"use client";

import { useEffect, useState } from "react";

export default function AdminDeliverySettingsPage() {
  const [zones, setZones] = useState([]);
  const [threshold, setThreshold] = useState(200);
  const [loading, setLoading] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [newZone, setNewZone] = useState({
    nameEn: "",
    nameAr: "",
    estimatedTime: "",
    estimatedTimeAr: "",
    price: 0,
    sortOrder: "",
    active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("adminToken");

      const [zonesRes, settingsRes] = await Promise.all([
        fetch("/api/admin/delivery-zones", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/site-settings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const zonesData = await zonesRes.json();
      const settingsData = await settingsRes.json();

      if (zonesData.success) setZones(zonesData.data);

      const t = Number(settingsData?.data?.freeDeliveryThreshold);
      if (Number.isFinite(t) && t >= 0) {
        setThreshold(t);
      }
    } catch (error) {
      console.error("Fetch delivery settings error:", error);
      setMessage("Failed to load delivery settings");
    } finally {
      setLoading(false);
    }
  };

  const patchZone = async (id, payload) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/delivery-zones/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Update failed");
      setMessage("Zone updated");
      setTimeout(() => setMessage(""), 1200);
      return data.data;
    } catch (e) {
      console.error(e);
      setMessage("Failed to update zone");
      throw e;
    }
  };

  const saveThreshold = async () => {
    setSavingThreshold(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          freeDeliveryThreshold: Number(threshold),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Save failed");
      setMessage("Free delivery threshold saved");
      setTimeout(() => setMessage(""), 1400);
    } catch (error) {
      console.error(error);
      setMessage("Failed to save threshold");
    } finally {
      setSavingThreshold(false);
    }
  };

  const createZone = async () => {
    setAdding(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/delivery-zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameEn: newZone.nameEn,
          nameAr: newZone.nameAr,
          estimatedTime: newZone.estimatedTime || "30-60 min",
          estimatedTimeAr: newZone.estimatedTimeAr || "30-60 دقيقة",
          price: Number(newZone.price || 0),
          sortOrder:
            newZone.sortOrder === "" ? undefined : Number(newZone.sortOrder),
          active: !!newZone.active,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Create failed");

      setZones((prev) =>
        [...prev, data.data].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
        )
      );
      setNewZone({
        nameEn: "",
        nameAr: "",
        estimatedTime: "",
        estimatedTimeAr: "",
        price: 0,
        sortOrder: "",
        active: true,
      });
      setMessage("Zone added");
      setTimeout(() => setMessage(""), 1400);
    } catch (error) {
      console.error("Create zone error:", error);
      setMessage("Failed to add zone");
    } finally {
      setAdding(false);
    }
  };

  const deleteZone = async (id) => {
    if (!window.confirm("Delete this delivery zone? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/delivery-zones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");
      setZones((prev) => prev.filter((z) => z.id !== id));
      setMessage("Zone deleted");
      setTimeout(() => setMessage(""), 1400);
    } catch (e) {
      console.error(e);
      setMessage("Failed to delete zone");
    }
  };

  const updateLocalZone = (id, field, value) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, [field]: value } : z))
    );
  };

  const onBlurSave = async (zone, field) => {
    const payload = { [field]: zone[field] };
    await patchZone(zone.id, payload);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-stone-800">Delivery Settings</h2>
          <p className="text-sm text-stone-500 mt-1">
            Manage delivery zones and free delivery threshold.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn btn-outline">
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm font-semibold">
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="font-bold text-stone-800 mb-4">Free Delivery Threshold</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Free Delivery Threshold (QAR)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="input w-full"
            />
          </div>
          <button
            onClick={saveThreshold}
            disabled={savingThreshold}
            className="btn btn-primary"
          >
            {savingThreshold ? "Saving..." : "Save Threshold"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="font-bold text-stone-800 mb-4">Add Delivery Zone</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="input"
            placeholder="Name EN (e.g. Doha)"
            value={newZone.nameEn}
            onChange={(e) => setNewZone((p) => ({ ...p, nameEn: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Name AR"
            value={newZone.nameAr}
            onChange={(e) => setNewZone((p) => ({ ...p, nameAr: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Time EN (e.g. 45-60 min)"
            value={newZone.estimatedTime}
            onChange={(e) =>
              setNewZone((p) => ({ ...p, estimatedTime: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Time AR"
            value={newZone.estimatedTimeAr}
            onChange={(e) =>
              setNewZone((p) => ({ ...p, estimatedTimeAr: e.target.value }))
            }
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="Price (QAR)"
            value={newZone.price}
            onChange={(e) =>
              setNewZone((p) => ({ ...p, price: e.target.value }))
            }
          />
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Sort order (optional)"
            value={newZone.sortOrder}
            onChange={(e) =>
              setNewZone((p) => ({ ...p, sortOrder: e.target.value }))
            }
          />
          <label className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-xl">
            <input
              type="checkbox"
              checked={newZone.active}
              onChange={(e) =>
                setNewZone((p) => ({ ...p, active: e.target.checked }))
              }
            />
            <span className="text-sm font-semibold text-stone-700">Active</span>
          </label>
          <button
            onClick={createZone}
            disabled={adding || !newZone.nameEn.trim() || !newZone.nameAr.trim()}
            className="btn btn-primary"
          >
            {adding ? "Adding..." : "Add Zone"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200">
          <h3 className="font-bold text-stone-800">Delivery Zones</h3>
          <p className="text-xs text-stone-500 mt-1">
            Recommended inline editing: change a field then click outside to save.
          </p>
        </div>

        {loading ? (
          <div className="h-44 flex items-center justify-center">
            <div className="text-4xl animate-bounce">🚚</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs uppercase text-stone-500">Sort</th>
                  <th className="text-left py-3 px-4 text-xs uppercase text-stone-500">Name EN</th>
                  <th className="text-left py-3 px-4 text-xs uppercase text-stone-500">Name AR</th>
                  <th className="text-left py-3 px-4 text-xs uppercase text-stone-500">Time EN</th>
                  <th className="text-left py-3 px-4 text-xs uppercase text-stone-500">Time AR</th>
                  <th className="text-left py-3 px-4 text-xs uppercase text-stone-500">Price (QAR)</th>
                  <th className="text-left py-3 px-4 text-xs uppercase text-stone-500">Active</th>
                  <th className="py-3 px-4 text-xs uppercase text-stone-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {zones.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-sm text-stone-500">
                      No delivery zones found. Add a zone above or click Refresh.
                    </td>
                  </tr>
                )}
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        className="input h-9 w-20"
                        value={zone.sortOrder ?? 0}
                        onChange={(e) =>
                          updateLocalZone(zone.id, "sortOrder", Number(e.target.value))
                        }
                        onBlur={() => onBlurSave(zone, "sortOrder")}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        className="input h-9"
                        value={zone.nameEn || ""}
                        onChange={(e) => updateLocalZone(zone.id, "nameEn", e.target.value)}
                        onBlur={() => onBlurSave(zone, "nameEn")}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        className="input h-9"
                        value={zone.nameAr || ""}
                        onChange={(e) => updateLocalZone(zone.id, "nameAr", e.target.value)}
                        onBlur={() => onBlurSave(zone, "nameAr")}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        className="input h-9"
                        value={zone.estimatedTime || ""}
                        onChange={(e) =>
                          updateLocalZone(zone.id, "estimatedTime", e.target.value)
                        }
                        onBlur={() => onBlurSave(zone, "estimatedTime")}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        className="input h-9"
                        value={zone.estimatedTimeAr || ""}
                        onChange={(e) =>
                          updateLocalZone(zone.id, "estimatedTimeAr", e.target.value)
                        }
                        onBlur={() => onBlurSave(zone, "estimatedTimeAr")}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input h-9 w-28"
                        value={zone.price ?? 0}
                        onChange={(e) =>
                          updateLocalZone(zone.id, "price", Number(e.target.value))
                        }
                        onBlur={() => onBlurSave(zone, "price")}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={async () => {
                          const newVal = !zone.active;
                          updateLocalZone(zone.id, "active", newVal);
                          try {
                            await patchZone(zone.id, { active: newVal });
                          } catch {
                            updateLocalZone(zone.id, "active", zone.active);
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          zone.active ? "bg-green-500" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            zone.active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteZone(zone.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                        title="Delete zone"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
