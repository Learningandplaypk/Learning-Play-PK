"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Coins, Flame, LogIn, LogOut, Settings, Trophy, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePlayer } from "@/lib/store";
import { levelFromXp, levelTitle } from "@/lib/gamification";
import { BADGES } from "@/data/badges";
import { fmt, pktDayKey, pktDayOffset } from "@/lib/utils";

function MiniRing({ level, progress, size = 40 }: { level: number; progress: number; size?: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="3.5" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      <span className="absolute font-display text-[11px] font-black text-fg tnum">{level}</span>
    </span>
  );
}

function WeekSpark({ results }: { results: Array<{ at: number; xp: number }> }) {
  const days = useMemo(() => {
    const today = pktDayKey();
    return Array.from({ length: 7 }, (_, i) => {
      const key = pktDayOffset(-(6 - i), today);
      const xp = results.filter((r) => pktDayKey(new Date(r.at)) === key).reduce((a, r) => a + r.xp, 0);
      return xp;
    });
  }, [results]);
  const max = Math.max(1, ...days);
  return (
    <div className="flex h-10 items-end gap-1" aria-hidden>
      {days.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: v > 0 ? "var(--brand)" : "var(--surface-2)",
          }}
        />
      ))}
    </div>
  );
}

/** Compact chip for the mobile top bar: avatar + streak. */
export function MobileAccountChip() {
  const xp = usePlayer((s) => s.xp);
  const streak = usePlayer((s) => s.streak);
  const avatar = usePlayer((s) => s.avatar);
  const level = levelFromXp(xp).level;

  return (
    <Link
      href="/profile"
      className="flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface-2 pe-2.5 ps-1 md:hidden"
      aria-label={`Profile — level ${level}, streak ${streak}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-tint text-sm" aria-hidden>
        {avatar}
      </span>
      <span className="flex items-center gap-0.5 text-xs font-bold text-accent-ink">
        <Flame size={13} strokeWidth={2.5} aria-hidden />
        <span className="tnum">{streak}</span>
      </span>
    </Link>
  );
}

/** Desktop account widget — stats inline, dropdown on hover/click. */
export function AccountWidget() {
  const { user, logout, configured } = useAuth();
  const xp = usePlayer((s) => s.xp);
  const streak = usePlayer((s) => s.streak);
  const coins = usePlayer((s) => s.coins);
  const name = usePlayer((s) => s.name);
  const avatar = usePlayer((s) => s.avatar);
  const badges = usePlayer((s) => s.badges);
  const results = usePlayer((s) => s.results);
  const lv = levelFromXp(xp);
  const title = levelTitle(lv.level);
  const displayName = user?.name || name || "Guest";
  const isGuest = !user;

  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const preview = BADGES.filter((b) => badges.includes(b.id)).slice(0, 6);

  if (isGuest) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-bold text-fg">
          <Coins size={14} strokeWidth={2.4} aria-hidden />
          <span className="tnum">{fmt(coins)}</span>
          <span className="text-muted">coins</span>
        </span>
        {configured ? (
          <Link href="/login" className="btn btn-primary btn-sm">
            <LogIn size={15} strokeWidth={2.3} /> Login
          </Link>
        ) : (
          <Link href="/profile" className="btn btn-secondary btn-sm">
            Guest
          </Link>
        )}
      </div>
    );
  }

  return (
    <div ref={root} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface pe-3 ps-1.5 text-start hover:bg-surface-2"
      >
        <MiniRing level={lv.level} progress={lv.progress} />
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate text-sm font-extrabold leading-tight text-fg">{displayName}</span>
          <span className="block text-[11px] font-semibold text-muted">
            Lvl {lv.level} · {title}
          </span>
        </span>
        <span className="hidden items-center gap-2 xl:flex">
          <span className="block h-1.5 w-16 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(lv.progress * 100)}%` }} />
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-accent-ink">
            <Flame size={13} strokeWidth={2.5} />
            <span className="tnum">{streak}</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-fg">
            <Coins size={13} strokeWidth={2.4} />
            <span className="tnum">{fmt(coins)}</span>
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          onMouseLeave={() => setOpen(false)}
          className="card-md absolute end-0 top-[calc(100%+8px)] z-[120] w-80 p-4"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-tint text-lg" aria-hidden>
              {avatar}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-extrabold text-fg">{displayName}</p>
              <p className="text-xs text-muted">
                Lvl {lv.level} · {title} · <span className="tnum">{fmt(xp)}</span> XP
              </p>
            </div>
          </div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Is hafte ka XP</p>
          <WeekSpark results={results} />
          {preview.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              {preview.map((b) => (
                <span key={b.id} title={b.name} className="grid h-8 w-8 place-items-center rounded-lg bg-brand-tint text-sm">
                  {b.emoji}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Link href="/profile" role="menuitem" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
              <User size={14} strokeWidth={2.3} /> Profile
            </Link>
            <Link href="/leaderboard" role="menuitem" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
              <Trophy size={14} strokeWidth={2.3} /> Leaderboard
            </Link>
            <Link href="/profile" role="menuitem" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              <Settings size={14} strokeWidth={2.3} /> Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
            >
              <LogOut size={14} strokeWidth={2.3} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Always-present coin target so flying coins have somewhere to land, even on mobile. */
export function NavCoinAnchor() {
  const coins = usePlayer((s) => s.coins);
  return (
    <span id="nav-coins" className="sr-only tnum">
      {fmt(coins)}
    </span>
  );
}
