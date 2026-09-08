/**
 * Hearts — a comfort mechanic in lessons, never a content lock.
 *
 * Free: 5 hearts max, one refills every hour, a rewarded ad gives +1 instantly.
 * Premium: unlimited (Infinity) — hearts are simply never subtracted.
 *
 * Running out of hearts NEVER blocks a lesson: the UI offers "wait / watch an ad /
 * keep practicing without hearts". Hearts only affect the scored-run mode.
 */

export const MAX_HEARTS = 5;
export const REFILL_MS = 60 * 60 * 1000; // 1 hour

export type HeartsState = {
  /** Hearts banked at `at`. */
  hearts: number;
  /** Epoch ms of the last time hearts were computed/spent. */
  at: number;
};

export function freshHearts(now = Date.now()): HeartsState {
  return { hearts: MAX_HEARTS, at: now };
}

/** Hearts available right now, applying time-based refill. Premium = Infinity. */
export function currentHearts(s: HeartsState | null | undefined, premium: boolean, now = Date.now()): number {
  if (premium) return Infinity;
  if (!s) return MAX_HEARTS;
  const gained = Math.floor(Math.max(0, now - s.at) / REFILL_MS);
  return Math.min(MAX_HEARTS, s.hearts + gained);
}

/** Normalize the stored state to "now" (folds accrued refills into the balance). */
export function settleHearts(s: HeartsState | null | undefined, premium: boolean, now = Date.now()): HeartsState {
  if (premium) return { hearts: MAX_HEARTS, at: now };
  if (!s) return freshHearts(now);
  const gained = Math.floor(Math.max(0, now - s.at) / REFILL_MS);
  if (gained <= 0) return s;
  const hearts = Math.min(MAX_HEARTS, s.hearts + gained);
  // keep the remainder so partial hours aren't lost
  const at = hearts >= MAX_HEARTS ? now : s.at + gained * REFILL_MS;
  return { hearts, at };
}

/** Spend one heart. Premium is a no-op. Never returns below 0. */
export function spendHeart(s: HeartsState | null | undefined, premium: boolean, now = Date.now()): HeartsState {
  if (premium) return { hearts: MAX_HEARTS, at: now };
  const settled = settleHearts(s, premium, now);
  if (settled.hearts <= 0) return { hearts: 0, at: settled.at };
  return { hearts: settled.hearts - 1, at: settled.hearts >= MAX_HEARTS ? now : settled.at };
}

/** Grant hearts (rewarded ad, coin purchase). Capped at MAX_HEARTS for free users. */
export function addHearts(s: HeartsState | null | undefined, n: number, premium: boolean, now = Date.now()): HeartsState {
  if (premium) return { hearts: MAX_HEARTS, at: now };
  const settled = settleHearts(s, premium, now);
  return { hearts: Math.min(MAX_HEARTS, settled.hearts + n), at: settled.at };
}

/** Milliseconds until the next heart refills; 0 when full or premium. */
export function msToNextHeart(s: HeartsState | null | undefined, premium: boolean, now = Date.now()): number {
  if (premium || !s) return 0;
  const settled = settleHearts(s, premium, now);
  if (settled.hearts >= MAX_HEARTS) return 0;
  return Math.max(0, REFILL_MS - ((now - settled.at) % REFILL_MS));
}

export function formatWait(ms: number): string {
  if (ms <= 0) return "abhi";
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
