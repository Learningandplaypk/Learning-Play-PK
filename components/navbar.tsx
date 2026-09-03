"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, fmt } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { usePlayer, type LangKey } from "@/lib/store";
import { levelFromXp, levelTitle } from "@/lib/gamification";

const LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/learn", key: "nav.learn" },
  { href: "/brain", key: "nav.brain" },
  { href: "/quiz", key: "nav.quiz" },
  { href: "/fun", key: "nav.fun" },
  { href: "/leaderboard", key: "nav.leaderboard" },
];

function Widget() {
  const xp = usePlayer((s) => s.xp);
  const coins = usePlayer((s) => s.coins);
  const streak = usePlayer((s) => s.streak);
  const lv = levelFromXp(xp);
  return (
    <Link href="/profile" className="glass glass-hover flex items-center gap-2.5 px-3 py-1.5" aria-label="Profile — XP, coins, streak">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-electric to-neon-purple text-[11px] font-black text-white">
        {lv.level}
      </span>
      <span className="hidden text-[11px] leading-tight sm:block">
        <span className="block font-bold text-ink">{levelTitle(lv.level)}</span>
        <span className="block text-muted">{fmt(xp)} XP</span>
      </span>
      <span className="hidden h-6 w-px bg-white/15 sm:block" />
      <span className="text-sm" title="coins">🪙 {fmt(coins)}</span>
      <span className="text-sm" title="streak">🔥 {streak}</span>
    </Link>
  );
}

function LangSwitch() {
  const { lang, setLang } = useI18n();
  const opts: Array<{ k: LangKey; label: string }> = [
    { k: "en", label: "EN" },
    { k: "roman", label: "UR" },
    { k: "ur", label: "اردو" },
  ];
  return (
    <div className="glass flex overflow-hidden rounded-full text-[11px] font-bold">
      {opts.map((o) => (
        <button
          key={o.k}
          onClick={() => setLang(o.k)}
          className={cn("px-2.5 py-1.5 transition", lang === o.k ? "bg-white/15 text-ink" : "text-muted hover:text-ink")}
          aria-pressed={lang === o.k}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-3">
      <nav
        className={cn(
          "pointer-events-auto flex w-full max-w-5xl items-center gap-2 rounded-full border border-white/10 px-3 py-2 backdrop-blur-xl transition-all duration-500",
          scrolled ? "bg-bg-900/85 shadow-[0_10px_40px_-12px_rgba(45,124,255,.35)]" : "bg-bg-900/50"
        )}
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-2 font-display text-base font-black">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-neon-green via-electric to-neon-purple text-sm shadow-[0_0_18px_-2px_rgba(57,255,20,.6)]">
            🦉
          </span>
          <span className="hidden text-gradient sm:block">Learn&Play PK</span>
        </Link>

        <div className="mx-1 hidden flex-1 items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition",
                  active ? "bg-white/12 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)]" : "text-muted hover:text-ink"
                )}
              >
                {t(l.key)}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(57,255,20,.9)]" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <LangSwitch />
          </div>
          <Link href="/premium" className="btn btn-pink btn-sm hidden sm:inline-flex">
            {t("nav.premium")}
          </Link>
          <Widget />
        </div>
      </nav>
    </header>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = [
    { href: "/", label: t("nav.home"), icon: "🏠" },
    { href: "/learn", label: t("nav.learn"), icon: "📚" },
    { href: "/brain", label: t("nav.brain"), icon: "🧠" },
    { href: "/quiz", label: t("nav.quiz"), icon: "❓" },
    { href: "/fun", label: t("nav.fun"), icon: "🎮" },
    { href: "/profile", label: t("nav.profile"), icon: "🦉" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-bg-900/90 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-lg grid-cols-6">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition", active ? "text-neon-green" : "text-muted")}
            >
              <span className={cn("text-lg transition-transform", active && "scale-110 drop-shadow-[0_0_8px_rgba(57,255,20,.8)]")} aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
