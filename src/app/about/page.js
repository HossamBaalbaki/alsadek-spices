"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";

// ─── INTERSECTION OBSERVER HOOK ───────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView(0.3);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── REVEAL WRAPPER ────────────────────────────────────────────────────────────
function Reveal({ children, className = "", direction = "up", delay = 0 }) {
  const [ref, inView] = useInView();
  const dirClass =
    direction === "left"
      ? "reveal-left"
      : direction === "right"
      ? "reveal-right"
      : direction === "scale"
      ? "reveal-scale"
      : "reveal";
  return (
    <div
      ref={ref}
      className={`${dirClass} ${inView ? "in-view" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}s` } : {}}
    >
      {children}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const { isArabic } = useLanguage();
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    fetch("/api/products?limit=1")
      .then((r) => r.json())
      .then((d) => { if (d.pagination?.total) setProductCount(d.pagination.total); })
      .catch(() => {});
  }, []);

  const content = {
    en: {
      heroBadge: "Our Story",
      heroTitle: ["About", "Hamad Special", "Spices"],
      heroSub:
        "Born in the heart of Doha, we've been crafting authentic Qatari spice blends with homemade techniques since January 2010.",

      storyLabel: "How it all began",
      storyTitle: "A Passion for Authentic Qatari Flavor",
      storyP1:
        "Hamad Special Spices was founded in January 2010 in Doha, Qatar — operated by Al Sadeq Trading. What began as a family passion for preserving authentic Qatari culinary heritage has grown into one of Qatar's most trusted premium spice brands.",
      storyP2:
        "Our secret is simple: homemade preparation techniques passed down through generations. Every blend is crafted with care, using clean and carefully selected ingredients that deliver a genuine taste experience you won't find anywhere else.",
      storyP3:
        "We believe in preserving the traditional culinary heritage of Qatar while bringing it to every home and professional kitchen. More than spices — we deliver culture, memory, and taste.",

      statsLabel: "By the numbers",
      statsTitle: "15+ Years of Trust",
      stats: [
        { value: productCount ?? 0, suffix: "", label: "Premium Products" },
        { value: 7000, suffix: "+", label: "Happy Customers" },
        { value: 15, suffix: "+", label: "Years in Qatar" },
        { value: 5, suffix: "", label: "Mobile Service Lines" },
      ],

      missionLabel: "What drives us",
      missionTitle: "Our Mission & Vision",
      missionSub:
        "To be recognized as a trusted Qatari spice brand that delivers authentic taste experiences while preserving traditional culinary heritage.",
      pillars: [
        {
          icon: "🌿",
          title: "Quality & Purity",
          desc: "High-quality, clean, and carefully prepared spice blends. No additives, no shortcuts — just pure authentic ingredients.",
        },
        {
          icon: "🏡",
          title: "Homemade Techniques",
          desc: "Every blend is prepared using authentic homemade techniques that enhance both home and professional cooking.",
        },
        {
          icon: "🤝",
          title: "Customer Satisfaction",
          desc: "Qatari craftsmanship and cultural relevance at every step — from sourcing to your table.",
        },
      ],

      timelineLabel: "Our journey",
      timelineTitle: "How We Got Here",
      timeline: [
        {
          year: "2010",
          icon: "🌱",
          title: "Founded in Doha",
          desc: "Hamad Special Spices was established in January 2010 by Al Sadeq Trading, starting with a passion for authentic Qatari spice blends.",
        },
        {
          year: "2013",
          icon: "📦",
          title: "Growing the Range",
          desc: "Expanded our product line to include a wide variety of seed, powder, and mixed spices crafted with homemade preparation methods.",
        },
        {
          year: "2017",
          icon: "🏆",
          title: "Established Brand",
          desc: "Became a recognized name across Doha for premium quality and authentic Qatari taste, trusted by homes and restaurants alike.",
        },
        {
          year: "2021",
          icon: "🚀",
          title: "Going Digital",
          desc: "Launched our online store, making our premium spice blends accessible to every corner of Qatar with fast delivery.",
        },
        {
          year: "2025",
          icon: "⭐",
          title: "Today & Beyond",
          desc: "Serving 7,000+ customers across Qatar with 500+ products, 5 direct contact lines, and an unwavering commitment to quality.",
        },
      ],

      valuesLabel: "What we stand for",
      valuesTitle: "Our Values",
      values: [
        { icon: "🌶️", title: "Authenticity", desc: "Genuine Qatari spice blends crafted with traditional homemade techniques." },
        { icon: "🌿", title: "Quality & Purity", desc: "Clean, carefully selected ingredients with no additives or artificial colors." },
        { icon: "🚚", title: "Fast Delivery", desc: "Prompt delivery across Qatar because fresh spices shouldn't wait." },
        { icon: "🏡", title: "Homemade Heritage", desc: "Recipes and methods passed down through generations of Qatari cooking tradition." },
        { icon: "❤️", title: "Customer First", desc: "Five direct contact lines and daily availability from 8 AM to 11 PM." },
        { icon: "🇶🇦", title: "Qatari Craftsmanship", desc: "Proudly made in Qatar — celebrating local culinary identity and culture." },
      ],

      ctaTitle: "Ready to Experience the Difference?",
      ctaSub: "Shop our full collection or reach us directly on WhatsApp — we're available daily.",
      ctaShop: "Shop Now",
      ctaChat: "Chat on WhatsApp",
    },

    ar: {
      heroBadge: "قصتنا",
      heroTitle: ["عن", "بهارات حمد", "المميزة"],
      heroSub:
        "نشأنا في قلب الدوحة، ونصنع خلطات قطرية أصيلة بتقنيات منزلية متوارثة منذ يناير 2010.",

      storyLabel: "كيف بدأنا",
      storyTitle: "شغف بالنكهة القطرية الأصيلة",
      storyP1:
        "تأسست بهارات حمد المميزة في يناير 2010 في الدوحة، قطر — تشغلها شركة الصادق للتجارة. بدأت شغفاً عائلياً بالحفاظ على التراث الطهوي القطري الأصيل، ونمت لتصبح واحدة من أكثر ماركات البهارات الفاخرة ثقةً في قطر.",
      storyP2:
        "سرّنا بسيط: تقنيات تحضير منزلية متوارثة عبر الأجيال. كل خلطة تُصنع بعناية من مكونات نقية ومختارة بدقة، لتمنحك تجربة نكهة أصيلة لا تجدها في أي مكان آخر.",
      storyP3:
        "نؤمن بالحفاظ على التراث الطهوي القطري وإيصاله إلى كل بيت ومطبخ احترافي. نحن لا نبيع بهارات فحسب — بل نوصل ثقافة وذكريات ونكهة.",

      statsLabel: "بالأرقام",
      statsTitle: "أكثر من 15 عاماً من الثقة",
      stats: [
        { value: productCount ?? 0, suffix: "", label: "منتج فاخر" },
        { value: 7000, suffix: "+", label: "عميل سعيد" },
        { value: 15, suffix: "+", label: "عاماً في قطر" },
        { value: 5, suffix: "", label: "خطوط تواصل مباشرة" },
      ],

      missionLabel: "ما يحركنا",
      missionTitle: "مهمتنا ورؤيتنا",
      missionSub:
        "أن نكون علامة قطرية موثوقة تقدم تجارب نكهة أصيلة مع الحفاظ على التراث الطهوي التقليدي.",
      pillars: [
        {
          icon: "🌿",
          title: "الجودة والنقاء",
          desc: "خلطات بهارات عالية الجودة ونظيفة ومحضّرة بعناية. لا إضافات، لا اختصارات — فقط مكونات أصيلة نقية.",
        },
        {
          icon: "🏡",
          title: "تقنيات منزلية",
          desc: "كل خلطة تُحضَّر بتقنيات منزلية أصيلة تُعزز الطهي المنزلي والاحترافي على حدٍّ سواء.",
        },
        {
          icon: "🤝",
          title: "رضا العملاء",
          desc: "حرفية قطرية وانتماء ثقافي في كل خطوة — من الاختيار إلى مائدتك.",
        },
      ],

      timelineLabel: "رحلتنا",
      timelineTitle: "كيف وصلنا إلى هنا",
      timeline: [
        {
          year: "2010",
          icon: "🌱",
          title: "التأسيس في الدوحة",
          desc: "تأسست بهارات حمد المميزة في يناير 2010 على يد شركة الصادق للتجارة، انطلاقاً من شغف بالخلطات القطرية الأصيلة.",
        },
        {
          year: "2013",
          icon: "📦",
          title: "توسيع التشكيلة",
          desc: "وسّعنا خط منتجاتنا ليشمل مجموعة واسعة من البهارات الكاملة والمطحونة والمخلوطة بتقنيات منزلية.",
        },
        {
          year: "2017",
          icon: "🏆",
          title: "علامة راسخة",
          desc: "أصبحنا اسماً معروفاً في الدوحة للجودة الفاخرة والنكهة القطرية الأصيلة، تثق بنا البيوت والمطاعم.",
        },
        {
          year: "2021",
          icon: "🚀",
          title: "الرقمنة",
          desc: "أطلقنا متجرنا الإلكتروني، لتصل خلطاتنا الفاخرة إلى كل ركن في قطر مع توصيل سريع.",
        },
        {
          year: "2025",
          icon: "⭐",
          title: "اليوم وما بعده",
          desc: "نخدم أكثر من 7,000 عميل في جميع أنحاء قطر بـ 500+ منتج و5 خطوط تواصل مباشرة والتزام لا يتزعزع بالجودة.",
        },
      ],

      valuesLabel: "ما نؤمن به",
      valuesTitle: "قيمنا",
      values: [
        { icon: "🌶️", title: "الأصالة", desc: "خلطات قطرية أصيلة تُحضَّر بتقنيات منزلية تقليدية متوارثة." },
        { icon: "🌿", title: "الجودة والنقاء", desc: "مكونات نظيفة ومختارة بعناية بلا إضافات أو ألوان اصطناعية." },
        { icon: "🚚", title: "التوصيل السريع", desc: "توصيل سريع في جميع أنحاء قطر، لأن البهارات الطازجة لا تنتظر." },
        { icon: "🏡", title: "تراث منزلي", desc: "وصفات وأساليب متوارثة عبر أجيال من المطبخ القطري التقليدي." },
        { icon: "❤️", title: "العميل أولاً", desc: "خمسة خطوط تواصل مباشرة ومتاحون يومياً من 8 صباحاً حتى 11 مساءً." },
        { icon: "🇶🇦", title: "الحرفية القطرية", desc: "صُنع بفخر في قطر — احتفاءً بالهوية الطهوية المحلية وموروثها الثقافي." },
      ],

      ctaTitle: "هل أنت مستعد لتجربة الفرق؟",
      ctaSub: "تسوق من مجموعتنا الكاملة أو تواصل معنا مباشرة على واتساب — متاحون يومياً.",
      ctaShop: "تسوق الآن",
      ctaChat: "تحدث على واتساب",
    },
  };

  const c = content[isArabic ? "ar" : "en"];

  return (
    <>
      <Navbar />
      <main className="pb-20 md:pb-12">

        {/* ═══════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════ */}
        <section className="relative min-h-[70vh] flex items-center bg-stone-950 overflow-hidden">
          {/* Glow layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_15%_60%,rgba(180,83,9,0.20)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_85%_25%,rgba(251,191,36,0.06)_0%,transparent_60%)]" />
          </div>

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* Floating elements */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <span className="absolute top-[12%] right-[7%]  text-[72px] opacity-[0.08] animate-float-slow">🌶️</span>
            <span className="absolute top-[58%] right-[22%] text-[52px] opacity-[0.06] animate-float-medium">🫙</span>
            <span className="absolute bottom-[15%] right-[5%]  text-[60px] opacity-[0.07] animate-float-fast">🌿</span>
            <span className="absolute top-[35%] left-[3%]   text-[44px] opacity-[0.04] animate-float-slow">⭐</span>
          </div>

          <div className="container relative z-10 py-24">
            {/* Animated badge */}
            <div className="reveal in-view inline-flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-400 text-sm font-semibold tracking-wide">
                {c.heroBadge}
              </span>
            </div>

            {/* Headline — each word on own line, staggered */}
            <h1 className="mb-7">
              {c.heroTitle.map((word, i) => (
                <span
                  key={i}
                  className={`block font-black leading-[1.04] reveal in-view stagger-${i + 1} ${
                    i === 1
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600"
                      : i === 2
                      ? "text-stone-500"
                      : "text-white"
                  } ${isArabic ? "text-[3rem] md:text-[6rem]" : "text-[3.2rem] md:text-[6.5rem]"}`}
                >
                  {word}
                </span>
              ))}
            </h1>

            <p className="reveal in-view stagger-4 text-stone-400 text-lg md:text-xl max-w-xl leading-relaxed">
              {c.heroSub}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            OUR STORY
        ═══════════════════════════════════════════════ */}
        <section className="py-24 bg-stone-50 overflow-hidden">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* Text */}
              <div>
                <Reveal direction="left">
                  <p className="text-amber-700 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                    {c.storyLabel}
                  </p>
                </Reveal>
                <Reveal direction="left" delay={0.1}>
                  <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-8 leading-tight">
                    {c.storyTitle}
                  </h2>
                </Reveal>
                {[c.storyP1, c.storyP2, c.storyP3].map((p, i) => (
                  <Reveal key={i} direction="left" delay={0.15 + i * 0.1}>
                    <p className="text-stone-600 leading-relaxed mb-5 text-base">
                      {p}
                    </p>
                  </Reveal>
                ))}
              </div>

              {/* Visual — spice art grid */}
              <Reveal direction="right">
                <div className="relative">
                  {/* Main card */}
                  <div className="bg-gradient-to-br from-amber-900 to-stone-900 rounded-3xl p-10 shadow-2xl">
                    <div className="grid grid-cols-3 gap-5 mb-8">
                      {["🌶️","🫙","🌿","🎁","⭐","🫚"].map((e, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-default"
                        >
                          {e}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/10 pt-6">
                      <p className="text-white font-black text-lg mb-1">
                        {isArabic ? "بهارات حمد المميزة" : "Hamad Special Spices"}
                      </p>
                      <p className="text-amber-400 text-sm">
                        {isArabic ? "الدوحة، قطر — منذ 2010" : "Doha, Qatar — Est. 2010"}
                      </p>
                    </div>
                  </div>

                  {/* Floating accent card */}
                  <div className="absolute -bottom-6 -right-6 bg-amber-700 rounded-2xl p-5 shadow-xl">
                    <p className="text-white font-black text-3xl">{productCount ?? "—"}</p>
                    <p className="text-amber-200 text-xs mt-1">
                      {isArabic ? "منتج فاخر" : "Premium Products"}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            STATS — animated counters
        ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-stone-950">
          <div className="container">
            <Reveal>
              <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 text-center">
                {c.statsLabel}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-16">
                {c.statsTitle}
              </h2>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {c.stats.map((s, i) => (
                <Reveal key={i} direction="scale" delay={i * 0.1}>
                  <div className="text-center p-8 rounded-3xl bg-stone-900 border border-stone-800 hover:border-amber-800/40 transition-colors">
                    <p className="text-4xl md:text-5xl font-black text-amber-400 mb-2">
                      <Counter
                        target={s.value}
                        suffix={s.suffix}
                        duration={1600 + i * 200}
                      />
                    </p>
                    <p className="text-stone-400 text-sm font-medium">{s.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            MISSION — 3 pillars
        ═══════════════════════════════════════════════ */}
        <section className="py-24 bg-amber-700 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-black/10 rounded-full" />
          </div>

          <div className="container relative">
            <div className="text-center mb-16">
              <Reveal>
                <p className="text-amber-200 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  {c.missionLabel}
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
                  {c.missionTitle}
                </h2>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-amber-100 text-lg max-w-2xl mx-auto leading-relaxed">
                  {c.missionSub}
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {c.pillars.map((p, i) => (
                <Reveal key={i} direction="scale" delay={i * 0.12}>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300">
                    <div className="text-5xl mb-5">{p.icon}</div>
                    <h3 className="font-black text-white text-xl mb-3">{p.title}</h3>
                    <p className="text-amber-100 text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            TIMELINE
        ═══════════════════════════════════════════════ */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="container">
            <div className="text-center mb-20">
              <Reveal>
                <p className="text-amber-700 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  {c.timelineLabel}
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-black text-stone-900">
                  {c.timelineTitle}
                </h2>
              </Reveal>
            </div>

            <div className="relative max-w-3xl mx-auto">
              {/* Vertical line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-stone-200 -translate-x-1/2" />

              {c.timeline.map((item, i) => {
                const isEven = i % 2 === 0;
                return (
                  <Reveal
                    key={i}
                    direction={isEven ? "left" : "right"}
                    delay={i * 0.1}
                  >
                    <div
                      className={`relative flex items-start gap-6 mb-14 ${
                        isEven ? "md:flex-row" : "md:flex-row-reverse"
                      } flex-row`}
                    >
                      {/* Year dot */}
                      <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                        <div className="w-12 h-12 bg-amber-700 rounded-full flex items-center justify-center text-xl shadow-lg shadow-amber-900/20 border-4 border-white">
                          {item.icon}
                        </div>
                      </div>

                      {/* Content card */}
                      <div
                        className={`ml-20 md:ml-0 ${
                          isEven
                            ? "md:mr-auto md:pr-20 md:text-right md:w-1/2"
                            : "md:ml-auto md:pl-20 md:text-left md:w-1/2"
                        }`}
                      >
                        <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
                          <span className="inline-block text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-3">
                            {item.year}
                          </span>
                          <h3 className="font-black text-stone-900 text-lg mb-2">
                            {item.title}
                          </h3>
                          <p className="text-stone-500 text-sm leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            VALUES — 6 cards
        ═══════════════════════════════════════════════ */}
        <section className="py-24 bg-stone-950">
          <div className="container">
            <div className="text-center mb-16">
              <Reveal>
                <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  {c.valuesLabel}
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-black text-white">
                  {c.valuesTitle}
                </h2>
              </Reveal>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {c.values.map((v, i) => (
                <Reveal
                  key={i}
                  direction="scale"
                  delay={i * 0.08}
                >
                  <div className="group p-7 rounded-3xl bg-stone-900 border border-stone-800 hover:border-amber-700/50 hover:bg-stone-800 transition-all duration-300 h-full">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {v.icon}
                    </div>
                    <h3 className="font-black text-white text-base mb-2">{v.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            CTA
        ═══════════════════════════════════════════════ */}
        <section className="py-24 bg-stone-900 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-700/8 rounded-full blur-3xl" />
          </div>

          <div className="container relative text-center">
            <Reveal direction="scale">
              <div className="max-w-2xl mx-auto">
                <div className="text-6xl mb-8 animate-float-slow inline-block">🌶️</div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
                  {c.ctaTitle}
                </h2>
                <p className="text-stone-400 text-lg mb-10 leading-relaxed">
                  {c.ctaSub}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/shop"
                    className="btn btn-primary btn-lg shadow-lg shadow-amber-900/30 font-black"
                  >
                    {c.ctaShop} {isArabic ? "←" : "→"}
                  </Link>
                  {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#1DB857] text-white font-black text-base transition-all duration-200 shadow-lg shadow-green-900/20"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {c.ctaChat}
                  </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
