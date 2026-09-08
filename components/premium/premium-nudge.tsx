"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { usePlayer } from "@/lib/store";
import { PRICE_PKR } from "@/lib/plans";

/**
 * Soft premium entry points. Rules we hold ourselves to:
 *  - never blocks anything, never a full-screen modal
 *  - at most ONCE per browser session after a game
 *  - dismissible, and the dismissal is remembered for the session
 *  - no countdown, no "only today", no fake scarcity
 */

const SESSION_KEY = "lpk-premium-note-shown";

function sessionSeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return true; // storage blocked → stay quiet
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Shown inside the game-over card, at most once per session. */
export function GameOverPremiumNote() {
  const premium = usePlayer((s) => s.premium);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (premium || sessionSeen()) return;
    markSeen();
    setShow(true);
  }, [premium]);

  if (!show || premium) return null;

  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-tint text-accent-ink">
        <Sparkles size={16} strokeWidth={2.3} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-fg">Khelna hamesha free rahega</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          Agar ads ke baghair, unlimited hearts aur weekly progress report ke sath khelna ho to Premium Rs.{" "}
          {PRICE_PKR.monthly}/mahina hai.{" "}
          <Link href="/premium" className="font-semibold text-brand-ink underline underline-offset-2">
            Dekh lo
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Band karo"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <X size={15} strokeWidth={2.4} />
      </button>
    </div>
  );
}

/** Tiny navbar chip. Hidden for premium users (they see the badge instead). */
export function NavPremiumChip() {
  const premium = usePlayer((s) => s.premium);
  const hydrated = usePlayer((s) => s.hydrated);
  if (!hydrated || premium) return null;
  return (
    <Link
      href="/premium"
      prefetch={false}
      className="hidden min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-bold text-muted transition-colors hover:bg-surface-2 hover:text-fg sm:inline-flex"
    >
      <Sparkles size={13} strokeWidth={2.4} className="text-accent-ink" />
      Go Premium
    </Link>
  );
}

/** Premium badge shown next to the name on leaderboard + profile. */
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      title="Premium member"
      className={
        "inline-flex items-center gap-1 rounded-full bg-accent-tint px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-accent-ink " +
        (className ?? "")
      }
    >
      <Sparkles size={10} strokeWidth={2.6} />
      Premium
    </span>
  );
}
