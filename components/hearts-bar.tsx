"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Infinity as InfinityIcon } from "lucide-react";
import { usePlayer } from "@/lib/store";
import { MAX_HEARTS, formatWait, msToNextHeart } from "@/lib/hearts";
import { RewardedAdButton } from "./ads";

/**
 * Hearts indicator for lessons.
 *
 * Premium → an infinity glyph, nothing else to think about.
 * Free    → 5 hearts, one refills per hour, plus a rewarded ad for +1 and a
 *           coin purchase. Running out never blocks the lesson: the copy makes
 *           clear you can keep practicing, you just stop losing hearts.
 */
export function HeartsBar({ className }: { className?: string }) {
  const premium = usePlayer((s) => s.premium);
  const heartsState = usePlayer((s) => s.heartsState);
  const grantHearts = usePlayer((s) => s.grantHearts);
  const spendCoins = usePlayer((s) => s.spendCoins);
  const coins = usePlayer((s) => s.coins);
  const toast = usePlayer((s) => s.toast);
  const [, tick] = useState(0);

  // refresh the countdown once a minute
  useEffect(() => {
    if (premium) return;
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, [premium]);

  if (premium) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg bg-danger-tint px-2 py-1 text-xs font-bold text-danger-ink ${className ?? ""}`}
        title="Premium — unlimited hearts"
      >
        <Heart size={13} strokeWidth={2.6} fill="currentColor" />
        <InfinityIcon size={14} strokeWidth={2.6} />
      </span>
    );
  }

  const hearts = Math.min(MAX_HEARTS, Math.max(0, heartsState.hearts));
  const wait = msToNextHeart(heartsState, false);

  const buyHeart = () => {
    if (spendCoins(30)) {
      grantHearts(1);
      toast("❤️", "Ek heart mil gaya", "30 coins kharch hue");
    } else {
      toast("🪙", "Coins kam hain", `Aapke paas ${coins} coins hain — 30 chahiye`);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${hearts} of ${MAX_HEARTS} hearts`}>
        {Array.from({ length: MAX_HEARTS }, (_, i) => (
          <Heart
            key={i}
            size={15}
            strokeWidth={2.4}
            className={i < hearts ? "text-danger" : "text-[var(--border)]"}
            fill={i < hearts ? "currentColor" : "none"}
            aria-hidden
          />
        ))}
      </span>
      {hearts < MAX_HEARTS && wait > 0 && (
        <span className="text-[11px] text-muted">+1 {formatWait(wait)} mein</span>
      )}
      {hearts === 0 && (
        <span className="text-[11px] text-muted">
          Hearts khatam — practice phir bhi jari rakh sakte ho.
        </span>
      )}
      {hearts < MAX_HEARTS && (
        <>
          <RewardedAdButton onReward={() => grantHearts(1)} />
          <button
            type="button"
            onClick={buyHeart}
            className="min-h-8 rounded-lg border border-line bg-surface px-2 text-[11px] font-bold text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            🪙 30 → +1
          </button>
          <Link
            href="/premium"
            className="min-h-8 rounded-lg px-1.5 text-[11px] font-semibold text-brand-ink underline underline-offset-2"
          >
            unlimited
          </Link>
        </>
      )}
    </div>
  );
}
