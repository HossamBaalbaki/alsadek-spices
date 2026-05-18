"use client";

import { useEffect, useState } from "react";

const DEFAULTS = {
  topBannerEn: "🌶️ Free delivery on orders above 200 QAR in Doha 🌶️",
  topBannerAr: "🌶️ توصيل مجاني للطلبات فوق 200 ر.ق في الدوحة 🌶️",
  promoTitleEn: "Free Delivery on Orders Over 150 QAR",
  promoTitleAr: "توصيل مجاني للطلبات فوق 150 ر.ق",
  promoSubtitleEn: "Shop our premium spices collection",
  promoSubtitleAr: "تسوق مجموعتنا من البهارات الفاخرة",
  freeDeliveryThreshold: 200,
};

const DEFAULT_TICKER_EN = ["🌶️ 100% Natural Spices", "🚚 Same-Day Delivery in Doha", "⭐ Premium Quality Guaranteed", "💰 Best Prices in Qatar", "🎁 Elegant Gift Bundles", "📦 Professional Packaging"];
const DEFAULT_TICKER_AR = ["🌶️ بهارات طبيعية 100%", "🚚 توصيل في نفس اليوم بالدوحة", "⭐ جودة فاخرة مضمونة", "💰 أفضل الأسعار في قطر", "🎁 باقات هدايا راقية", "📦 تغليف احترافي"];

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    ...DEFAULTS,
    tickerItemsEn: DEFAULT_TICKER_EN.join("\n"),
    tickerItemsAr: DEFAULT_TICKER_AR.join("\n"),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("/api/admin/site-settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load settings");
        if (!active) return;
        setForm({
          topBannerEn: data.data?.topBannerEn || DEFAULTS.topBannerEn,
          topBannerAr: data.data?.topBannerAr || DEFAULTS.topBannerAr,
          promoTitleEn: data.data?.promoTitleEn || DEFAULTS.promoTitleEn,
          promoTitleAr: data.data?.promoTitleAr || DEFAULTS.promoTitleAr,
          promoSubtitleEn: data.data?.promoSubtitleEn || DEFAULTS.promoSubtitleEn,
          promoSubtitleAr: data.data?.promoSubtitleAr || DEFAULTS.promoSubtitleAr,
          freeDeliveryThreshold: Number(data.data?.freeDeliveryThreshold ?? DEFAULTS.freeDeliveryThreshold),
          tickerItemsEn: (data.data?.tickerItemsEn?.length ? data.data.tickerItemsEn : DEFAULT_TICKER_EN).join("\n"),
          tickerItemsAr: (data.data?.tickerItemsAr?.length ? data.data.tickerItemsAr : DEFAULT_TICKER_AR).join("\n"),
        });
      } catch (e) {
        if (!active) return;
        setErr(e.message || "Failed to load settings");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, []);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        ...form,
        tickerItemsEn: String(form.tickerItemsEn || "").split("\n").map((s) => s.trim()).filter(Boolean),
        tickerItemsAr: String(form.tickerItemsAr || "").split("\n").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save settings");
      setMsg("Settings updated successfully.");
    } catch (e) {
      setErr(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-4xl animate-pulse">⚙️</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-stone-800">Homepage Settings</h2>
        <p className="text-stone-500 text-sm mt-1">Edit Arabic and English home banner messages.</p>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{err}</div>
      )}
      {msg && (
        <div className="rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">{msg}</div>
      )}

      <form onSubmit={onSave} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6">

        {/* Top Banner */}
        <div>
          <h3 className="font-bold text-stone-800 mb-3">Top Banner Message</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">English</label>
              <textarea className="input w-full min-h-[100px]" value={form.topBannerEn} onChange={(e) => onChange("topBannerEn", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">العربية</label>
              <textarea dir="rtl" className="input w-full min-h-[100px]" value={form.topBannerAr} onChange={(e) => onChange("topBannerAr", e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Promo Section Title */}
        <div>
          <h3 className="font-bold text-stone-800 mb-3">Promo Section Title</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">English</label>
              <input className="input w-full" value={form.promoTitleEn} onChange={(e) => onChange("promoTitleEn", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">العربية</label>
              <input dir="rtl" className="input w-full" value={form.promoTitleAr} onChange={(e) => onChange("promoTitleAr", e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Promo Section Subtitle */}
        <div>
          <h3 className="font-bold text-stone-800 mb-3">Promo Section Subtitle</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">English</label>
              <textarea className="input w-full min-h-[90px]" value={form.promoSubtitleEn} onChange={(e) => onChange("promoSubtitleEn", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">العربية</label>
              <textarea dir="rtl" className="input w-full min-h-[90px]" value={form.promoSubtitleAr} onChange={(e) => onChange("promoSubtitleAr", e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Ticker Items */}
        <div>
          <h3 className="font-bold text-stone-800 mb-1">Ticker Items</h3>
          <p className="text-stone-500 text-xs mb-3">One item per line. These scroll across the marquee banner on the homepage.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">English</label>
              <textarea
                className="input w-full min-h-[160px] font-mono text-sm"
                value={form.tickerItemsEn}
                onChange={(e) => onChange("tickerItemsEn", e.target.value)}
                placeholder={"🌶️ 100% Natural Spices\n🚚 Same-Day Delivery in Doha"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">العربية</label>
              <textarea
                dir="rtl"
                className="input w-full min-h-[160px] font-mono text-sm"
                value={form.tickerItemsAr}
                onChange={(e) => onChange("tickerItemsAr", e.target.value)}
                placeholder={"🌶️ بهارات طبيعية 100%\n🚚 توصيل في نفس اليوم بالدوحة"}
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div>
          <h3 className="font-bold text-stone-800 mb-3">Delivery Settings</h3>
          <div className="max-w-sm">
            <label className="block text-sm font-semibold text-stone-700 mb-2">Free Delivery Threshold (QAR)</label>
            <input
              type="number"
              min="0"
              className="input w-full"
              value={form.freeDeliveryThreshold}
              onChange={(e) => onChange("freeDeliveryThreshold", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
