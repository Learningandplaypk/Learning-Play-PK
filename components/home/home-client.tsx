"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, TiltCard, SectionHeading, Progress } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { levelFromXp } from "@/lib/gamification";
import { fmt } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Scene3D } from "@/components/home3d/scene";
import { scrollState } from "@/lib/scroll-state";

/* ---------- static content ---------- */

const ZONES = [
  {
    id: "learn",
    emoji: "📚",
    title: "Learn Zone",
    urdu: "Seekho Zone",
    desc: "English, Arabic, Korean samet 8 zubanein — word games, grammar quests, listening challenges. Duolingo wali feeling, Pakistani twist ke sath.",
    href: "/learn",
    cta: "Enter Learn Zone",
    color: "from-neon-green/25 to-electric/20",
  },
  {
    id: "brain",
    emoji: "🧠",
    title: "Brain Zone",
    urdu: "Dimaag Zone",
    desc: "Memory match, Sudoku, 2048, Chess AI, reaction tests — 10 dimaagi games jo tez dimaag banate hain.",
    href: "/brain",
    cta: "Enter Brain Zone",
    color: "from-neon-purple/25 to-pink-accent/20",
  },
  {
    id: "quiz",
    emoji: "❓",
    title: "Quiz Zone",
    urdu: "Quiz Zone",
    desc: "GK, Pakistan, Islam, Science, Cricket aur Kon Banega Crorepati format — 10 quiz topics, lakhon sawalat jaisa maza.",
    href: "/quiz",
    cta: "Enter Quiz Zone",
    color: "from-electric/25 to-neon-purple/20",
  },
  {
    id: "fun",
    emoji: "🎮",
    title: "Fun Zone",
    urdu: "Masti Zone",
    desc: "Snake 3D, Tetris, Flappy, Fruit Ninja, Racing — 15 classic arcade games, neon style mein.",
    href: "/fun",
    cta: "Enter Fun Zone",
    color: "from-neon-orange/25 to-pink-accent/20",
  },
];

const LANGS = [
  { slug: "english", flag: "🇬🇧", name: "English", native: "English", color: "#2d7cff" },
  { slug: "arabic", flag: "🇸🇦", name: "Arabic", native: "العربية", color: "#39ff14" },
  { slug: "turkish", flag: "🇹🇷", name: "Turkish", native: "Türkçe", color: "#ff2e97" },
  { slug: "chinese", flag: "🇨🇳", name: "Chinese", native: "中文", color: "#ff7a00" },
  { slug: "french", flag: "🇫🇷", name: "French", native: "Français", color: "#2d7cff" },
  { slug: "spanish", flag: "🇪🇸", name: "Spanish", native: "Español", color: "#ff7a00" },
  { slug: "korean", flag: "🇰🇷", name: "Korean", native: "한국어", color: "#b026ff" },
  { slug: "japanese", flag: "🇯🇵", name: "Japanese", native: "日本語", color: "#ff2e97" },
];

const TESTIMONIALS = [
  { name: "Ayesha Khan", city: "Lahore", text: "Pehli baar games khel kar English seekhi hai — grammar quest ka maza hi kuch aur hai! Meri beti bhi lag gayi hai.", emoji: "👩‍🎓" },
  { name: "Bilal Ahmed", city: "Karachi", text: "Snake 3D aur Tetris toh addictive hain, aur XP system ne streak banana shuru kar diya. 21 din ka streak hai mera!", emoji: "🧑‍💻" },
  { name: "Fatima Noor", city: "Islamabad", text: "Arabic seekh rahi hoon Quran samajhne ke liye — Urdu meanings ke sath bohot asaan hai. Highly recommended!", emoji: "🧕" },
  { name: "Usman Tariq", city: "Faisalabad", text: "Kon Banega Crorepati wala quiz zone kamal ka hai. Lifelines bhi hain aur paisay wasool fun hai!", emoji: "🧔" },
];

const FAQS = [
  { q: "Kya yeh bilkul free hai?", a: "Haan! Learn & Play PK ka poora game catalog aur lessons 100% free hain. Free plan mein roz 5 games + 3 lessons milte hain. Premium (Rs. 399/mahina) par unlimited games, no ads, progress reports aur certificate milta hai." },
  { q: "Mobile par chalega?", a: "Bilkul — website mobile-first banaee gayi hai. Android Chrome se 'Add to Home Screen' karo aur app ki tarah install ho jata hai, offline bhi chalta hai (PWA)." },
  { q: "Kaun si languages available hain?", a: "English (full course) + Arabic (Quranic vocabulary samet), Turkish, Chinese, French, Spanish, Korean aur Japanese — har language mein Urdu meanings ke sath." },
  { q: "Progress save hota hai?", a: "Bina account bhi progress aapke browser mein save hota hai. Login karo toh progress cloud (Firestore) mein save hota hai aur leaderboard par aata hai." },
  { q: "Payments kaun si hain?", a: "Premium ke liye Stripe (international cards) aur Safepay (JazzCash, EasyPaisa, Pakistani debit/credit cards) — dono secure checkout ke sath." },
];

/* ---------- tiny animated counter ---------- */

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1600;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref}>
      {fmt(val)}
      {suffix}
    </span>
  );
}

/* ---------- coverflow carousel ---------- */

function LangCarousel() {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="relative mx-auto h-72 max-w-4xl" style={{ perspective: "1100px" }}>
        {LANGS.map((l, i) => {
          const offset = ((i - active + LANGS.length * 1.5) % LANGS.length) - Math.floor(LANGS.length / 2);
          const abs = Math.abs(offset);
          if (abs > 3) return null;
          return (
            <Link
              key={l.slug}
              href={`/learn/${l.slug}`}
              onClick={() => setActive(i)}
              className="absolute left-1/2 top-1/2 block h-60 w-44 transition-all duration-500"
              style={{
                transform: `translate(-50%,-50%) translateX(${offset * 46}%) translateZ(${(-abs * 90)}px) rotateY(${offset * -28}deg) scale(${1 - abs * 0.1})`,
                zIndex: 10 - abs,
                opacity: abs > 2 ? 0.25 : 1,
                pointerEvents: abs > 2 ? "none" : "auto",
              }}
              aria-label={`${l.name} seekho`}
            >
              <div
                className="glass glass-hover flex h-full w-full flex-col items-center justify-center gap-3 rounded-3xl"
                style={{ boxShadow: `0 0 40px -12px ${l.color}66`, borderColor: `${l.color}55` }}
              >
                <span className="text-5xl">{l.flag}</span>
                <span className="font-display text-lg font-bold">{l.name}</span>
                <span className="text-sm text-muted" style={{ fontFamily: "inherit" }}>{l.native}</span>
                <span className="chip" style={{ color: l.color, borderColor: `${l.color}66` }}>
                  Seekho →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {LANGS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Language ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-neon-green shadow-[0_0_10px_rgba(57,255,20,.8)]" : "w-2 bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- leaderboard preview ---------- */

function LeaderPreview() {
  const results = usePlayer((s) => s.results);
  const name = usePlayer((s) => s.name);
  const xp = usePlayer((s) => s.xp);
  const preview = [
    { name: "Ayesha_K", xp: 14200, emoji: "👩‍🎓" },
    { name: "SnakeKing92", xp: 12850, emoji: "🎮" },
    { name: "Bilal.ahmed", xp: 11100, emoji: "🧑‍💻" },
    { name: name || "Tum", xp, emoji: "🦉", you: true },
    { name: "FatimaNoor", xp: 9800, emoji: "🧕" },
  ].sort((a, b) => b.xp - a.xp);
  void results;
  return (
    <div className="glass mx-auto max-w-md p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-display font-bold">🏆 Global Top — is haftay</h4>
        <Link href="/leaderboard" className="text-xs text-electric hover:underline">
          Sab dekho →
        </Link>
      </div>
      <ol className="space-y-2">
        {preview.map((p, i) => (
          <li key={p.name} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${p.you ? "bg-neon-green/10 border border-neon-green/30" : "bg-white/5"}`}>
            <span className="w-6 text-center font-display font-black text-muted">{i + 1}</span>
            <span className="text-xl">{p.emoji}</span>
            <span className={`flex-1 text-sm font-semibold ${p.you ? "text-neon-green" : ""}`}>{p.name}</span>
            <span className="text-xs text-muted">{fmt(p.xp)} XP</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- main ---------- */

export default function HomeClient() {
  const root = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<number[]>([0, 0.1, 0.3, 0.42, 0.5, 0.58, 0.66, 0.74, 0.85, 1]);
  const { t } = useI18n();
  const streak = usePlayer((s) => s.streak);
  const xp = usePlayer((s) => s.xp);
  const lv = levelFromXp(xp);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanup: Array<() => void> = [];

    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { default: Lenis } = await import("lenis");
      gsap.registerPlugin(ScrollTrigger);

      // measure section boundaries for the camera path
      const measure = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const frac = (id: string) => {
          const el = document.getElementById(id);
          if (!el) return 0;
          return Math.min(0.98, Math.max(0, (el.offsetTop - window.innerHeight * 0.35) / max));
        };
        const steps = Array.from(document.querySelectorAll<HTMLElement>(".zone-step"));
        const zFr = steps.map((s) => Math.min(0.98, Math.max(0, (s.offsetTop - window.innerHeight * 0.35) / max)));
        const arr = [0, frac("tunnel"), frac("zones"), ...zFr, frac("gamify"), frac("langs"), 1];
        setSections(arr);
        ScrollTrigger.refresh();
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(document.body);
      cleanup.push(() => ro.disconnect());

      // smooth scroll + scrolltrigger sync
      if (!reduced) {
        const lenis = new Lenis({ lerp: 0.09 });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        cleanup.push(() => {
          gsap.ticker.remove(raf);
          lenis.destroy();
        });
      }

      ScrollTrigger.create({
        trigger: "#experience",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          scrollState.progress = self.progress;
        },
      });

      // hero headline char reveal
      const chars = document.querySelectorAll<HTMLElement>(".hero-char");
      if (chars.length && !reduced) {
        gsap.from(chars, { opacity: 0, y: 70, rotateX: -80, stagger: 0.045, duration: 0.9, ease: "back.out(1.6)", delay: 0.25 });
      }

      // tunnel pinned words
      const words = gsap.utils.toArray<HTMLElement>(".tunnel-word");
      if (words.length && !reduced) {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "#tunnel", start: "top top", end: "bottom bottom", scrub: 0.6 },
        });
        words.forEach((w, i) => {
          tl.fromTo(w, { opacity: 0, scale: 0.7, filter: "blur(12px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1 });
          tl.to(w, { opacity: 0, scale: 1.25, filter: "blur(14px)", duration: 1 }, ">0.6");
          void i;
        });
      }

      // generic reveals
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        if (reduced) return;
        gsap.from(el, {
          opacity: 0,
          y: 46,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" },
        });
      });

      // mouse parallax for 3D camera
      if (!reduced) {
        const onMove = (e: MouseEvent) => {
          scrollState.mx = (e.clientX / window.innerWidth - 0.5) * 2;
          scrollState.my = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        cleanup.push(() => window.removeEventListener("mousemove", onMove));
      }

      cleanup.push(() => ScrollTrigger.getAll().forEach((st) => st.kill()));
    })();

    return () => cleanup.forEach((fn) => fn());
  }, []);

  return (
    <div ref={root}>
      <Scene3D sections={sections} />
      {/* soft CSS aurora behind canvas */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-electric/12 blur-[120px]" />
        <div className="absolute bottom-0 right-1/5 h-[30rem] w-[30rem] rounded-full bg-neon-purple/12 blur-[120px]" />
      </div>

      <div id="experience" className="relative z-10">
        {/* ============ A · HERO ============ */}
        <section id="hero" className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 text-center">
          <div className="chip mb-6 animate-pulse-glow border-neon-green/40 text-neon-green">🚀 Pakistan ka pehla 3D learning arcade</div>
          <h1 className="font-display text-[13vw] font-black leading-[0.95] sm:text-7xl lg:text-8xl" aria-label={t("home.heroA")}>
            {"Seekho + Khelo.".split("").map((ch, i) => (
              <span key={i} className="hero-char inline-block text-gradient will-change-transform" aria-hidden>
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h1>
          <p className="reveal mt-6 max-w-xl text-base text-muted sm:text-lg">{t("home.tagline")}</p>
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/fun" className="btn btn-neon">
              🎮 {t("cta.start")}
            </Link>
            <Link href="/learn/english" className="btn btn-ghost">
              📚 {t("cta.learnEnglish")}
            </Link>
          </div>
          <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="chip">👥 <Counter to={12400} /> learners</span>
            <span className="chip">🎯 <Counter to={820000} /> games played</span>
            <span className="chip">🌍 8 languages</span>
            {streak > 0 && <span className="chip border-neon-green/40 text-neon-green">🔥 {streak} day streak — keep going!</span>}
            {lv.level > 1 && <span className="chip border-neon-purple/40 text-neon-purple">Lv {lv.level} • {fmt(xp)} XP</span>}
          </div>
          <div className="absolute bottom-8 flex flex-col items-center gap-2 text-muted" aria-hidden>
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll karo</span>
            <div className="grid h-10 w-6 place-items-start justify-center rounded-full border border-white/25 p-1">
              <div className="h-2 w-1 animate-bounce rounded-full bg-neon-green" />
            </div>
          </div>
        </section>

        {/* ============ B · WARP TUNNEL ============ */}
        <section id="tunnel" className="relative h-[320vh]">
          <div className="sticky top-0 flex h-screen items-center justify-center">
            {["Learn 📖", "Play 🎮", "Compete 🏆", "Earn Rewards 💰"].map((w) => (
              <div key={w} className="tunnel-word absolute font-display text-5xl font-black sm:text-7xl">
                <span className="text-gradient">{w}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============ C · 4 ZONES ============ */}
        <section id="zones" className="relative mx-auto max-w-6xl px-5 py-16">
          <div className="reveal">
            <SectionHeading kicker="4 Zones" title={t("home.zonesTitle")} sub="Har zone ka apna 3D experience — scroll karo aur har zone ka door kholo." />
          </div>
          {ZONES.map((z, i) => (
            <div key={z.id} className="zone-step flex min-h-[92vh] items-center">
              <div className={`reveal grid w-full items-center gap-8 ${i % 2 ? "md:[direction:rtl]" : ""}`}>
                <div className="md:[direction:ltr] md:w-1/2">
                  <TiltCard className={`relative overflow-hidden bg-gradient-to-br ${z.color} p-8`} intensity={8}>
                    <div className="mb-4 text-6xl drop-shadow-[0_0_24px_rgba(45,124,255,.7)]">{z.emoji}</div>
                    <h3 className="font-display text-2xl font-black sm:text-3xl">{z.title}</h3>
                    <p className="urdu mt-1 text-sm text-neon-green">{z.urdu}</p>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted">{z.desc}</p>
                    <Link href={z.href} className="btn btn-neon mt-6">
                      {z.cta} →
                    </Link>
                  </TiltCard>
                </div>
                <div className="hidden md:block md:w-1/2" />
              </div>
            </div>
          ))}
        </section>

        {/* ============ D · GAMIFICATION ============ */}
        <section id="gamify" className="relative mx-auto max-w-5xl px-5 py-24">
          <div className="reveal">
            <SectionHeading kicker="Level Up" title={t("home.streakTitle")} sub="Har game XP deta hai. Streak jalo, coins kamao, 30 badges unlock karo aur leaderboard par naamo chhaao." />
          </div>
          <div className="reveal grid gap-5 md:grid-cols-3">
            {[
              { e: "⚡", t: "XP + 50 Levels", d: "Newbie se Legend tak — har level par naya title aur unlock." },
              { e: "🔥", t: "Daily Streak", d: "Roz khelo, streak jalao. Streak freeze se miss hue din bachao." },
              { e: "🏆", t: "30 Badges", d: "Trophy room bharo — pehla win se lekar 30-day streak tak." },
              { e: "🪙", t: "Coins + Shop", d: "Coins se hints, extra lives aur streak freeze khareedo." },
              { e: "📅", t: "Daily Rewards", d: "7-din ka chest cycle — din 7 par 100 coins + freeze." },
              { e: "📈", t: "Leaderboards", d: "Global, weekly aur per-game rankings — Pakistan bhar se muqabla." },
            ].map((f) => (
              <TiltCard key={f.t} className="p-6">
                <div className="text-4xl">{f.e}</div>
                <h4 className="mt-3 font-display text-lg font-bold">{f.t}</h4>
                <p className="mt-2 text-sm text-muted">{f.d}</p>
              </TiltCard>
            ))}
          </div>
          <div className="reveal mt-10">
            <LeaderPreview />
          </div>
        </section>

        {/* ============ E · LANGUAGES ============ */}
        <section id="langs" className="relative px-5 py-24">
          <div className="reveal">
            <SectionHeading kicker="8 Languages" title={t("home.langsTitle")} sub="Har language mein Urdu + English meanings, native script, romanization aur pronunciation practice." />
          </div>
          <div className="reveal">
            <LangCarousel />
          </div>
        </section>

        {/* ============ F · PREMIUM ============ */}
        <section id="pricing" className="relative mx-auto max-w-4xl px-5 py-24">
          <div className="reveal">
            <SectionHeading kicker="Premium" title={t("home.premiumTitle")} sub="Free hamesha free rahega — Premium un logon ke liye jo aur bhi tez seekhna chahte hain." />
          </div>
          <div className="reveal grid gap-5 md:grid-cols-2">
            <TiltCard className="p-8" intensity={6}>
              <h3 className="font-display text-2xl font-bold">Free</h3>
              <div className="mt-2 font-display text-4xl font-black">Rs. 0</div>
              <p className="mt-1 text-sm text-muted">Hamesha free</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {["43 games — sab khel sakta hai", "Roz 5 games + 3 lessons", "XP, streaks, badges", "Leaderboards", "2 languages starter content"].map((f) => (
                  <li key={f} className="flex gap-2 text-muted">✅ {f}</li>
                ))}
              </ul>
              <Link href="/fun" className="btn btn-ghost mt-7 w-full">
                Free mein khelo
              </Link>
            </TiltCard>
            <TiltCard className="relative p-8" intensity={6}>
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-pink-accent to-neon-orange px-3 py-1 text-xs font-black text-black">BEST VALUE</div>
              <h3 className="font-display text-2xl font-bold text-gradient">Premium</h3>
              <div className="mt-2 font-display text-4xl font-black">
                Rs. 399<span className="text-base font-semibold text-muted">/mahina</span>
              </div>
              <p className="mt-1 text-sm text-muted">Jab chaho cancel karo</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {["Unlimited games + lessons", "Zero ads", "Progress reports + weekly digest", "Certificate download (PDF)", "Saari 8 languages full content", "Exclusive avatar frames", "Priority support"].map((f) => (
                  <li key={f} className="flex gap-2 text-ink">⭐ {f}</li>
                ))}
              </ul>
              <Link href="/premium" className="btn btn-neon mt-7 w-full">
                ⚡ Premium Lo
              </Link>
            </TiltCard>
          </div>
          <div className="reveal glass mx-auto mt-8 max-w-2xl p-5">
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>Free vs Premium — value compare</span>
              <span>Premium 6.6x zyada content</span>
            </div>
            <Progress value={86} />
          </div>
        </section>

        {/* ============ G · TESTIMONIALS + FAQ ============ */}
        <section id="community" className="relative mx-auto max-w-5xl px-5 py-24">
          <div className="reveal">
            <SectionHeading kicker="Community" title="Pakistan bol raha hai" sub="Asli students, asli progress — Karachi se Peshawar tak." />
          </div>
          <div className="reveal grid gap-5 sm:grid-cols-2">
            {TESTIMONIALS.map((tm) => (
              <TiltCard key={tm.name} className="p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-electric/40 to-neon-purple/40 text-2xl">{tm.emoji}</span>
                  <div>
                    <div className="font-display text-sm font-bold">{tm.name}</div>
                    <div className="text-xs text-muted">{tm.city} • ⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-ink/85">“{tm.text}”</p>
              </TiltCard>
            ))}
          </div>

          <div className="reveal mt-20">
            <SectionHeading kicker="FAQ" title="Sawal? Jawab hazir." />
          </div>
          <div className="reveal mx-auto max-w-2xl space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="glass group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-display text-[15px] font-bold">
                  {f.q}
                  <span className="text-neon-green transition-transform group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="reveal mt-24 text-center">
            <h3 className="font-display text-3xl font-black sm:text-5xl">
              <span className="text-gradient">Chalo shuru karein!</span>
            </h3>
            <p className="mx-auto mt-3 max-w-md text-muted">Account banane ki zaroorat nahi — pehla game abhi khelo.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/fun/snake3d" className="btn btn-neon">
                🐍 Snake 3D khelo
              </Link>
              <Link href="/learn/english" className="btn btn-ghost">
                📚 English Lesson 1
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
