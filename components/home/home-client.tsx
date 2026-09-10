"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check, Coins, Flame, Gift, GraduationCap, Quote, Target, Zap } from "lucide-react";
import { Button, ButtonLink, Card, Chip, Progress, SectionHeading } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { getGameData } from "@/lib/games-data";
import { continueLang } from "@/lib/lang-progress";
import { getLangMeta } from "@/lib/lang-registry";
import { levelFromXp, levelTitle } from "@/lib/gamification";
import { fmt, pktDayKey } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { HeroVisual } from "@/components/home3d/hero-visual";
import { ZoneArt, Ustad, type ZoneKey } from "@/components/brand/ustad";
import { Reveal } from "@/components/motion/reveal";
import { InViewCounter } from "@/components/home/in-view-counter";

const HomeScroll = dynamic(() => import("@/components/home/home-scroll"), { ssr: false });

const HOW = [
  { n: "01", title: "Seekho", body: "Zubaan chuno — English se Korean tak, Urdu meanings ke sath." },
  { n: "02", title: "Khelo", body: "Words, quiz, snake, sudoku — har game XP deta hai." },
  { n: "03", title: "Jeeto", body: "Streak jalao, badges kholo, leaderboard par naam likhwao." },
];

const ZONES: Array<{ id: ZoneKey; title: string; line: string; count: string; href: string }> = [
  { id: "learn", title: "Learn", line: "21 zubanein — words, grammar, listening, pronunciation.", count: "21 languages", href: "/learn" },
  { id: "brain", title: "Brain", line: "Memory, Sudoku, 2048, Chess — dimaag ki training.", count: "10 games", href: "/brain" },
  { id: "quiz", title: "Quiz", line: "GK, Pakistan, Islam, Science aur Millionaire.", count: "10 topics", href: "/quiz" },
  { id: "fun", title: "Fun", line: "Snake, Tetris, Racing, Fruit Ninja — pure masti.", count: "15 games", href: "/fun" },
];

const TESTIMONIALS = [
  { name: "Ayesha Khan", city: "Lahore", text: "Pehli baar games khel kar English seekhi — grammar quest ka maza hi kuch aur hai. Meri beti bhi lag gayi hai." },
  { name: "Bilal Ahmed", city: "Karachi", text: "Snake aur Tetris addictive hain, aur XP system ne streak banana shuru kar diya. 21 din ka streak hai mera!" },
  { name: "Fatima Noor", city: "Islamabad", text: "Arabic seekh rahi hoon Quran samajhne ke liye — Urdu meanings ke sath bohot asaan hai." },
];

const FAQS = [
  { q: "Kya yeh bilkul free hai?", a: "Haan — sach mein. Saare 43 games, saare levels aur saari 21 zubanein free hain, bina kisi daily limit ke. Premium (Rs. 299/mahina) sirf tajurba behtar karta hai: zero ads, unlimited hearts, progress report, certificate." },
  { q: "Mobile par chalega?", a: "Bilkul. Mobile-first PWA hai — Android Chrome se \"Add to Home Screen\" karo aur app ki tarah chalta hai, offline bhi." },
  { q: "Kaun si languages hain?", a: "English (full course) + Urdu, Arabic (Quranic vocabulary samet), German, French, Spanish, Turkish, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Bengali, Malay, Persian, Punjabi, Pashto, Sindhi aur Balochi — sab Urdu meanings ke sath." },
  { q: "Progress save hota hai?", a: "Bina account bhi progress browser mein save hoti hai. Login karo toh cloud (Firestore) mein save hoti hai aur leaderboard par aati hai." },
];

/* --------------------------- continue playing --------------------------- */

function ContinueCard() {
  const results = usePlayer((s) => s.results);
  const lastLearnLang = usePlayer((s) => s.lastLearnLang);
  const learningLanguages = usePlayer((s) => s.learningLanguages);
  const last = results[0];
  // "Continue learning" always points back into the language you last played
  const learnLang = continueLang(lastLearnLang, learningLanguages);
  const href = useMemo(() => {
    if (!last) return `/learn/${learnLang}`;
    if (last.zone === "learn") return `/learn/${learnLang}/${last.slug}`;
    return `/${last.zone}/${last.slug}`;
  }, [last, learnLang]);
  const meta = last ? getGameData(last.slug) : undefined;
  const learnMeta = getLangMeta(learnLang);
  if (!last) {
    return (
      <Card className="mb-10 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint">
            <ZoneArt zone="learn" className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Continue learning</p>
            <p className="truncate font-display text-base font-extrabold text-fg">{learnMeta?.name ?? "English"}</p>
            <p className="text-xs text-muted">Words, phrases aur games — 5 minute mein ek lesson.</p>
          </div>
        </div>
        <Link href={href} className="btn btn-primary btn-sm">
          Shuru karo <ArrowRight size={16} strokeWidth={2.4} />
        </Link>
      </Card>
    );
  }

  return (
    <Card className="mb-10 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint">
          <ZoneArt zone={last.zone} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Continue where you left</p>
          <p className="truncate font-display text-base font-extrabold text-fg">{meta?.title ?? last.slug}</p>
          <p className="text-xs text-muted">
            {last.zone === "learn" && <span className="me-1">{learnMeta?.name} ·</span>}
            Last score <span className="tnum">{fmt(last.score)}</span> · +<span className="tnum">{last.xp}</span> XP
          </p>
        </div>
      </div>
      <Link href={href} className="btn btn-primary btn-sm">
        Dobara khelo <ArrowRight size={16} strokeWidth={2.4} />
      </Link>
    </Card>
  );
}

/* --------------------------- today's challenges ------------------------- */

function TodayChallenges() {
  const streak = usePlayer((s) => s.streak);
  const lastPlayDay = usePlayer((s) => s.lastPlayDay);
  const lastRewardDay = usePlayer((s) => s.lastRewardDay);
  const premium = usePlayer((s) => s.premium);
  const claimDailyReward = usePlayer((s) => s.claimDailyReward);
  const toast = usePlayer((s) => s.toast);
  const today = pktDayKey();

  const playedToday = lastPlayDay === today;
  const rewardReady = lastRewardDay !== today;

  const claim = () => {
    const r = claimDailyReward();
    if (r) toast("🎁", "Daily chest mil gaya!", `${r.coins} coins · ${r.xp} XP`);
  };

  const items = [
    {
      icon: <Target size={20} strokeWidth={2.3} />,
      title: "Aaj 1 game khelo",
      body: playedToday ? "Ho gaya — kal phir milte hain." : "Jitne chaho khelo — koi limit nahi.",
      value: playedToday ? 100 : 0,
      cta: playedToday ? null : { label: "Khelo", href: "/fun" },
    },
    {
      icon: <Flame size={20} strokeWidth={2.3} />,
      title: `Streak ${streak} din`,
      body: playedToday ? "Aaj ka streak pakka ho gaya." : "Aaj khelo — streak tootne se bachao.",
      value: playedToday ? 100 : 40,
      cta: playedToday ? null : { label: "Streak bachao", href: "/quiz" },
      accent: true,
    },
    {
      icon: <Gift size={20} strokeWidth={2.3} />,
      title: "Daily chest",
      body: rewardReady ? "Aaj ka inaam lene ka waqt ho gaya." : "Kal phir aana — naya inaam hoga.",
      value: rewardReady ? 100 : 0,
      cta: rewardReady ? null : undefined,
      action: rewardReady ? (
        <Button size="sm" onClick={claim}>
          Claim karo
        </Button>
      ) : undefined,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <Card key={it.title} className="p-4">
          <div className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-[10px]"
              style={{
                background: it.accent ? "var(--accent-tint)" : "var(--brand-tint)",
                color: it.accent ? "var(--accent-ink)" : "var(--brand-ink)",
              }}
            >
              {it.icon}
            </span>
            <h3 className="font-display text-sm font-extrabold text-fg">{it.title}</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{it.body}</p>
          <Progress value={it.value} tone={it.accent ? "accent" : "brand"} className="mt-3" label={`${it.title}: ${Math.round(it.value)}%`} />
          <div className="mt-3">
            {it.action ??
              (it.cta ? (
                <Link href={it.cta.href} className="btn btn-secondary btn-sm w-full">
                  {it.cta.label}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink">
                  <Check size={14} strokeWidth={2.6} /> Complete
                </span>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function HomeClient() {
  const { t } = useI18n();
  const xp = usePlayer((s) => s.xp);
  const streak = usePlayer((s) => s.streak);
  const coins = usePlayer((s) => s.coins);
  const premium = usePlayer((s) => s.premium);
  const lv = levelFromXp(xp);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="pb-24 md:pb-10">
      <HomeScroll />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ------------------------------- HERO ------------------------------- */}
      <section className="container-page page-pad pb-10 pt-8 md:pb-14 md:pt-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <Chip tone="brand" className="mb-4">
              🇵🇰 Pakistan ka learning arcade — 100% free
            </Chip>
            <h1 className="font-display text-4xl font-black leading-[1.05] text-fg sm:text-5xl lg:text-6xl">
              Khelo. Seekho. <span className="text-brand-ink">Jeeto.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">
              {t("home.tagline")}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/learn/english" size="lg">
                Shuru karo — Free
              </ButtonLink>
              <ButtonLink href="/fun" size="lg" variant="secondary">
                Games dekho
              </ButtonLink>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {["Bina account ke khelo", "Koi daily limit nahi", "Offline bhi chalta hai"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Check size={16} strokeWidth={2.6} className="text-brand-ink" /> {f}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Chip tone="accent">
                <Zap size={13} strokeWidth={2.4} /> {fmt(xp)} XP · {levelTitle(lv.level)}
              </Chip>
              <Chip tone={streak > 0 ? "accent" : "neutral"}>
                <Flame size={13} strokeWidth={2.4} /> {streak} din ka streak
              </Chip>
              <Chip>
                <Coins size={13} strokeWidth={2.4} /> {fmt(coins)} coins
              </Chip>
              {premium && (
                <Chip tone="brand">
                  <GraduationCap size={13} strokeWidth={2.4} /> Premium
                </Chip>
              )}
            </div>
          </div>

          <div className="order-first lg:order-last">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* --------------------------- CONTINUE ------------------------------ */}
      <section className="container-page page-pad">
        <ContinueCard />
      </section>

      {/* ------------------------------ ZONES ------------------------------ */}
      <section className="container-page page-pad py-4">
        <SectionHeading
          title="4 zones — ek hi jagah"
          sub="Har zone ka apna set: seekho, dimaag chalao, quiz khelo ya bas masti karo."
          action={
            <Link
              href="/fun"
              className="-my-1 inline-flex min-h-11 items-center text-sm font-semibold text-brand-ink hover:underline"
            >
              Saare games dekho →
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ZONES.map((z) => (
            <Link key={z.id} href={z.href} className="group">
              <Card className="card-interactive flex h-full flex-col p-4 transition-colors group-hover:border-brand">
                <span className="card-art mb-4 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint">
                  <ZoneArt zone={z.id} className="h-9 w-9" />
                </span>
                <h3 className="font-display text-lg font-extrabold text-fg">{z.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{z.line}</p>
                <p className="mt-3 text-xs font-semibold text-brand-ink">{z.count}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------- HOW IT WORKS --------------------------- */}
      <section id="how-it-works" className="container-page page-pad py-10">
        <Reveal>
          <SectionHeading title="Kaise kaam karta hai" sub="Teen simple qadam — seekho, khelo, jeeto." />
        </Reveal>
        <div className="grid gap-3 md:grid-cols-3">
          {HOW.map((step, i) => (
            <Reveal key={step.n} delay={i * 80}>
              <Card
                data-step
                data-active={i === 0 ? "true" : "false"}
                className="h-full p-5 transition-colors data-[active=true]:border-brand"
              >
                <p className="font-display text-sm font-black text-brand-ink">{step.n}</p>
                <h3 className="mt-2 font-display text-lg font-extrabold text-fg">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------- TODAY'S CHALLENGES --------------------- */}
      <section className="container-page page-pad py-10">
        <Reveal>
          <SectionHeading title="Aaj ke challenges" sub="Chhote goals — roz thora thora, bara farq." />
        </Reveal>
        <Reveal>
          <TodayChallenges />
        </Reveal>
      </section>

      {/* -------------------------- GAMIFICATION --------------------------- */}
      <section className="container-page page-pad py-4">
        <Reveal>
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-extrabold text-fg">XP, streak, badges</h2>
            <p className="mt-1 text-sm text-muted">Har game aapko aage le jata hai — aaj ka progress yeh raha.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Level", value: lv.progress * 100, tone: "brand" as const, caption: `Lv ${lv.level} · ${levelTitle(lv.level)}` },
                { label: "Streak", value: Math.min(100, streak * 10), tone: "accent" as const, caption: `${streak} din` },
                { label: "Coins", value: Math.min(100, coins), tone: "brand" as const, caption: `${fmt(coins)} coins` },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <span>{row.label}</span>
                    <span>{row.caption}</span>
                  </div>
                  <div className="track">
                    <span
                      data-fill
                      style={{
                        width: `${row.value}%`,
                        background: row.tone === "accent" ? "var(--accent)" : "var(--brand)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </section>

      {/* ---------------------------- SOCIAL PROOF ------------------------- */}
      <section className="container-page page-pad py-4">
        <Card className="p-5 sm:p-6">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-4">
            {[
              { v: 43, suffix: "", l: "Games — sab free" },
              { v: 8, suffix: "", l: "Zubanein, Urdu meanings ke sath" },
              { v: 450, suffix: "+", l: "Quiz sawalat" },
            ].map((s) => (
              <div key={s.l} className="text-center sm:text-start">
                <div className="font-display text-3xl font-black text-fg">
                  <InViewCounter value={s.v} suffix={s.suffix} />
                </div>
                <div className="text-sm text-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {TESTIMONIALS.map((tm) => (
            <Card key={tm.name} className="p-5">
              <Quote size={18} strokeWidth={2.4} className="text-brand" aria-hidden />
              <p className="mt-2 text-sm leading-relaxed text-fg">“{tm.text}”</p>
              <p className="mt-3 text-xs font-semibold text-muted">
                {tm.name} · {tm.city}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* -------------------------------- FAQ ------------------------------ */}
      <section className="container-page page-pad py-10">
        <SectionHeading title="Sawal? Jawab hazir." />
        <div className="grid gap-3 md:grid-cols-2">
          {FAQS.map((f) => (
            <details key={f.q} className="card p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-sm font-extrabold text-fg">
                {f.q}
                <span className="text-xl leading-none text-brand-ink transition-transform">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ------------------------------ CTA band --------------------------- */}
      <section className="container-page page-pad pb-4">
        <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Ustad mood="celebrate" className="h-16 w-16 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-fg">Chalo shuru karein!</h2>
              <p className="text-sm text-muted">Account banane ki zaroorat nahi — pehla game abhi khelo.</p>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <ButtonLink href="/fun/snake3d" size="lg">
              Snake khelo
            </ButtonLink>
            <ButtonLink href="/learn/english" size="lg" variant="secondary">
              English Lesson 1
            </ButtonLink>
          </div>
        </Card>
      </section>
    </div>
  );
}
