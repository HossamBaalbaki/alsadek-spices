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
  workingHoursEn: "Daily: 8:00 AM - 11:00 PM",
  workingHoursAr: "يومياً: 8:00 صباحاً - 11:00 مساءً",
  whatsappNumber: "97466556393",
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
          workingHoursEn: data.data?.workingHoursEn || DEFAULTS.workingHoursEn,
          workingHoursAr: data.data?.workingHoursAr || DEFAULTS.workingHoursAr,
          whatsappNumber: data.data?.whatsappNumber || DEFAULTS.whatsappNumber,
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

        {/* Working Hours */}
        <div>
          <h3 className="font-bold text-stone-800 mb-1">Working Hours</h3>
          <p className="text-stone-500 text-xs mb-3">Displayed in the footer and contact page.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">English</label>
              <input
                className="input w-full"
                value={form.workingHoursEn}
                onChange={(e) => onChange("workingHoursEn", e.target.value)}
                placeholder="Daily: 8:00 AM - 11:00 PM"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">العربية</label>
              <input
                dir="rtl"
                className="input w-full"
                value={form.workingHoursAr}
                onChange={(e) => onChange("workingHoursAr", e.target.value)}
                placeholder="يومياً: 8:00 صباحاً - 11:00 مساءً"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Number */}
        <div>
          <h3 className="font-bold text-stone-800 mb-1">WhatsApp Number</h3>
          <p className="text-stone-500 text-xs mb-3">Used for the floating WhatsApp button and the contact form. Include country code, no spaces or + (e.g. 97466556393).</p>
          <div className="max-w-sm">
            <input
              className="input w-full font-mono"
              value={form.whatsappNumber}
              onChange={(e) => onChange("whatsappNumber", e.target.value)}
              placeholder="97466556393"
            />
            {form.whatsappNumber && (
              <a
                href={`https://wa.me/${form.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-green-600 hover:underline"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Test this number →
              </a>
            )}
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
