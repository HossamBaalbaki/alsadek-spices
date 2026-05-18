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

  const content = {
    en: {
      heroBadge: "Our Story",
      heroTitle: ["About", "Al Sadek", "Spices"],
      heroSub:
        "Born in the heart of Doha, we've been bringing the world's finest spices to Qatari homes since 2018.",

      storyLabel: "How it all began",
      storyTitle: "A Passion for Pure Flavor",
      storyP1:
        "Al Sadek Spices was founded in 2018 by a family with deep roots in Qatar's culinary tradition. What started as a small market stall in Doha's old souq has grown into one of Qatar's most trusted premium spice destinations.",
      storyP2:
        "We travel to the source — from the saffron fields of Iran and the pepper coasts of Kerala to the cardamom hills of Guatemala — selecting only the highest quality spices that meet our exacting standards.",
      storyP3:
        "Every gram we sell carries the story of the land it came from, the hands that harvested it, and the generations of knowledge that shaped it. We are not just selling spices. We are delivering culture.",

      statsLabel: "By the numbers",
      statsTitle: "Trusted by Thousands",
      stats: [
        { value: 500, suffix: "+", label: "Premium Products" },
        { value: 10000, suffix: "+", label: "Happy Customers" },
        { value: 6, suffix: "+", label: "Years in Qatar" },
        { value: 15, suffix: "+", label: "Source Countries" },
      ],

      missionLabel: "What drives us",
      missionTitle: "Our Mission",
      missionSub:
        "To bring authentic, uncompromised flavors from every corner of the world directly to your kitchen in Qatar.",
      pillars: [
        {
          icon: "🌿",
          title: "Purity",
          desc: "We never use additives, preservatives, or artificial colors. What you receive is exactly what nature intended.",
        },
        {
          icon: "🔬",
          title: "Quality Control",
          desc: "Every batch is tested for aroma, color, and potency before it reaches your door. No exceptions.",
        },
        {
          icon: "🤝",
          title: "Fair Trade",
          desc: "We work directly with farmers and cooperatives, ensuring ethical sourcing and fair compensation across our supply chain.",
        },
      ],

      timelineLabel: "Our journey",
      timelineTitle: "How We Got Here",
      timeline: [
        {
          year: "2018",
          icon: "🌱",
          title: "Humble Beginnings",
          desc: "Started as a small stall in Doha's Souq Waqif, selling hand-selected whole spices to local families and restaurants.",
        },
        {
          year: "2019",
          icon: "📦",
          title: "First Warehouse",
          desc: "Opened our first storage and processing facility in Al Wakra, enabling bulk sourcing directly from origin countries.",
        },
        {
          year: "2021",
          icon: "🚀",
          title: "Going Digital",
          desc: "Launched our online store, bringing premium spices to every corner of Qatar with same-day delivery in Doha.",
        },
        {
          year: "2023",
          icon: "🎁",
          title: "Gift Collections",
          desc: "Introduced our signature gift bundles — curated, beautifully packaged sets that became Qatar's go-to premium gift.",
        },
        {
          year: "2025",
          icon: "⭐",
          title: "Today & Beyond",
          desc: "Serving 10,000+ customers across Qatar with 500+ products and a commitment to never compromise on quality.",
        },
      ],

      valuesLabel: "What we stand for",
      valuesTitle: "Our Values",
      values: [
        { icon: "🌶️", title: "Authenticity", desc: "Real spices from real origins. No blending, no substitutions." },
        { icon: "💚", title: "Sustainability", desc: "Eco-friendly packaging and environmentally conscious sourcing." },
        { icon: "🚚", title: "Speed", desc: "Same-day delivery in Doha because freshness can't wait." },
        { icon: "💰", title: "Fairness", desc: "Premium quality shouldn't mean premium-only prices." },
        { icon: "📚", title: "Knowledge", desc: "We educate our customers on how to use each spice to its fullest." },
        { icon: "❤️", title: "Community", desc: "Proud to serve Qatar's diverse community and celebrate every cuisine." },
      ],

      ctaTitle: "Ready to Experience the Difference?",
      ctaSub: "Shop our full collection or chat with our spice experts on WhatsApp.",
      ctaShop: "Shop Now",
      ctaChat: "Chat on WhatsApp",
    },

    ar: {
      heroBadge: "قصتنا",
      heroTitle: ["عن", "الصادق", "للبهارات"],
      heroSub:
        "نشأنا في قلب الدوحة، ونُحضر أفضل البهارات في العالم إلى المنازل القطرية منذ عام 2018.",

      storyLabel: "كيف بدأنا",
      storyTitle: "شغف بنكهة أصيلة",
      storyP1:
        "تأسست الصادق للبهارات عام 2018 على يد عائلة قطرية ذات جذور عميقة في التراث الطهوي. بدأت كبسطة صغيرة في أسواق الدوحة القديمة، ونمت لتصبح واحدة من أكثر وجهات البهارات الفاخرة ثقةً في قطر.",
      storyP2:
        "نسافر إلى المصدر — من حقول الزعفران في إيران وسواحل الفلفل في كيرالا إلى تلال الهيل في غواتيمالا — لنختار فقط أعلى جودة من البهارات التي تلبي معاييرنا الصارمة.",
      storyP3:
        "كل جرام نبيعه يحمل قصة الأرض التي جاء منها، والأيدي التي حصدته، والأجيال من المعرفة التي شكّلته. نحن لا نبيع بهارات فحسب، بل نوصل ثقافات.",

      statsLabel: "بالأرقام",
      statsTitle: "ثقة الآلاف",
      stats: [
        { value: 500, suffix: "+", label: "منتج فاخر" },
        { value: 10000, suffix: "+", label: "عميل سعيد" },
        { value: 6, suffix: "+", label: "سنوات في قطر" },
        { value: 15, suffix: "+", label: "دولة مصدر" },
      ],

      missionLabel: "ما يحركنا",
      missionTitle: "مهمتنا",
      missionSub:
        "إحضار نكهات أصيلة وغير مخففة من كل ركن في العالم مباشرة إلى مطبخك في قطر.",
      pillars: [
        {
          icon: "🌿",
          title: "النقاء",
          desc: "لا نستخدم أي إضافات أو مواد حافظة أو ألوان اصطناعية. ما تحصل عليه هو بالضبط ما أرادته الطبيعة.",
        },
        {
          icon: "🔬",
          title: "مراقبة الجودة",
          desc: "كل دفعة تُختبر للرائحة والون والقوة قبل أن تصل إليك. لا استثناءات.",
        },
        {
          icon: "🤝",
          title: "التجارة العادلة",
          desc: "نعمل مباشرة مع المزارعين لضمان الحصول الأخلاقي والتعويض العادل في سلسلة التوريد.",
        },
      ],

      timelineLabel: "رحلتنا",
      timelineTitle: "كيف وصلنا إلى هنا",
      timeline: [
        {
          year: "2018",
          icon: "🌱",
          title: "البدايات المتواضعة",
          desc: "بدأنا بسطة صغيرة في سوق واقف بالدوحة، نبيع البهارات الكاملة المختارة يدوياً للعائلات والمطاعم المحلية.",
        },
        {
          year: "2019",
          icon: "📦",
          title: "أول مستودع",
          desc: "افتتحنا أول منشأة تخزين ومعالجة في الوكرة، مما مكّننا من الاستيراد المباشر من دول المنشأ.",
        },
        {
          year: "2021",
          icon: "🚀",
          title: "الرقمنة",
          desc: "أطلقنا متجرنا الإلكتروني، ليصل للبهارات الفاخرة إلى كل ركن في قطر مع توصيل في نفس اليوم.",
        },
        {
          year: "2023",
          icon: "🎁",
          title: "مجموعات الهدايا",
          desc: "أطلقنا باقات الهدايا المميزة — مجموعات منسقة بتغليف راقٍ أصبحت الهدية الفاخرة الأولى في قطر.",
        },
        {
          year: "2025",
          icon: "⭐",
          title: "اليوم وما بعده",
          desc: "نخدم أكثر من 10,000 عميل في جميع أنحاء قطر مع 500+ منتج والتزام لا يتزعزع بالجودة.",
        },
      ],

      valuesLabel: "ما نؤمن به",
      valuesTitle: "قيمنا",
      values: [
        { icon: "🌶️", title: "الأصالة", desc: "بهارات حقيقية من أصول حقيقية. لا خلط، لا استبدال." },
        { icon: "💚", title: "الاستدامة", desc: "تغليف صديق للبيئة ومصادر مسؤولة بيئياً." },
        { icon: "🚚", title: "السرعة", desc: "توصيل في نفس اليوم في الدوحة لأن الطازج لا يحتمل الانتظار." },
        { icon: "💰", title: "العدالة", desc: "الجودة الفاخرة لا يجب أن تعني أسعاراً فاخرة فقط." },
        { icon: "📚", title: "المعرفة", desc: "نثقف عملاءنا على كيفية استخدام كل بهار لأقصى إمكاناته." },
        { icon: "❤️", title: "المجتمع", desc: "فخورون بخدمة مجتمع قطر المتنوع والاحتفاء بكل مطبخ." },
      ],

      ctaTitle: "هل أنت مستعد لتجربة الفرق؟",
      ctaSub: "تسوق من مجموعتنا الكاملة أو تحدث مع خبراء البهارات لدينا على واتساب.",
      ctaShop: "تسوق الآن",
      ctaChat: "تحدث على واتساب",
    },
  };

  const c = content[isArabic ? "ar" : "en"];

  return (
    <>
      <Navbar />
      <main>

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
                        {isArabic ? "الصادق للبهارات" : "Al Sadek Spices"}
                      </p>
                      <p className="text-amber-400 text-sm">
                        {isArabic ? "الدوحة، قطر — منذ 2018" : "Doha, Qatar — Est. 2018"}
                      </p>
                    </div>
                  </div>

                  {/* Floating accent card */}
                  <div className="absolute -bottom-6 -right-6 bg-amber-700 rounded-2xl p-5 shadow-xl">
                    <p className="text-white font-black text-3xl">500+</p>
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
