/**
 * Entitlements — the single place that answers "is this user premium right now?".
 *
 * Shape stored in Firestore users/{uid} (server-written only):
 *   isPremium: boolean
 *   premiumExpiry: "YYYY-MM-DD" | null
 *   premiumPlan: "premium-monthly" | "premium-yearly" | null
 *   premiumProvider: "safepay" | "stripe" | null
 *   trialEnd: "YYYY-MM-DD" | null
 *
 * Access continues for GRACE_DAYS after premiumExpiry (payment retries, bank
 * delays) and then downgrades automatically — no cron required for correctness.
 *
 * Pure functions only: imported by the client store AND by server routes.
 */

import { GRACE_DAYS } from "./plans";
import { pktDayKey, pktDayOffset } from "./utils";

export type Entitlement = {
  isPremium: boolean;
  premiumExpiry: string | null;
  premiumPlan?: string | null;
  premiumProvider?: string | null;
  trialEnd?: string | null;
};

export type EntitlementStatus = {
  /** Full premium benefits apply. */
  active: boolean;
  /** Expiry has passed but we are inside the grace window. */
  inGrace: boolean;
  /** Currently inside a free trial. */
  trialing: boolean;
  /** Days until expiry (negative = expired). null when no expiry set. */
  daysLeft: number | null;
  expiry: string | null;
  plan: string | null;
};

/** Whole days between two YYYY-MM-DD keys (b - a). */
export function daysBetween(a: string, b: string): number {
  const pa = Date.parse(`${a}T00:00:00Z`);
  const pb = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(pa) || Number.isNaN(pb)) return 0;
  return Math.round((pb - pa) / 86400000);
}

export function entitlementStatus(e: Entitlement | null | undefined, today = pktDayKey()): EntitlementStatus {
  const empty: EntitlementStatus = { active: false, inGrace: false, trialing: false, daysLeft: null, expiry: null, plan: null };
  if (!e) return empty;

  const trialing = !!e.trialEnd && daysBetween(today, e.trialEnd) >= 0;
  if (!e.isPremium) return { ...empty, expiry: e.premiumExpiry ?? null, plan: e.premiumPlan ?? null, trialing };

  // isPremium with no expiry (lifetime / comped) → active
  if (!e.premiumExpiry) {
    return { active: true, inGrace: false, trialing, daysLeft: null, expiry: null, plan: e.premiumPlan ?? null };
  }

  const daysLeft = daysBetween(today, e.premiumExpiry);
  const graceEnd = pktDayOffset(GRACE_DAYS, e.premiumExpiry);
  const active = daysLeft >= 0 || daysBetween(today, graceEnd) >= 0;
  const inGrace = daysLeft < 0 && active;

  return { active, inGrace, trialing, daysLeft, expiry: e.premiumExpiry, plan: e.premiumPlan ?? null };
}

/** Convenience boolean — used everywhere a feature must be gated. */
export function isPremiumActive(e: Entitlement | null | undefined, today = pktDayKey()): boolean {
  return entitlementStatus(e, today).active;
}

/** Compute a new expiry when a payment lands (stacks on remaining time). */
export function extendExpiry(current: string | null | undefined, months: number, today = pktDayKey()): string {
  const from = current && daysBetween(today, current) > 0 ? current : today;
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Streak protection — Freeze 2/month, Repair 1/month (premium)        */
/* ------------------------------------------------------------------ */

export const PREMIUM_FREEZES_PER_MONTH = 2;
export const PREMIUM_REPAIRS_PER_MONTH = 1;

export type MonthlyAllowance = {
  /** "YYYY-MM" in PKT — when this changes, counters reset. */
  cycle: string;
  freezesUsed: number;
  repairsUsed: number;
};

export function currentCycle(today = pktDayKey()): string {
  return today.slice(0, 7);
}

export function freshAllowance(today = pktDayKey()): MonthlyAllowance {
  return { cycle: currentCycle(today), freezesUsed: 0, repairsUsed: 0 };
}

/** Roll the allowance forward if the PKT month changed. */
export function rollAllowance(a: MonthlyAllowance | null | undefined, today = pktDayKey()): MonthlyAllowance {
  const cycle = currentCycle(today);
  if (!a || a.cycle !== cycle) return freshAllowance(today);
  return a;
}

export function monthlyAllowance(
  a: MonthlyAllowance | null | undefined,
  premium: boolean,
  today = pktDayKey()
): { freezesLeft: number; repairsLeft: number; cycle: string } {
  const rolled = rollAllowance(a, today);
  if (!premium) return { freezesLeft: 0, repairsLeft: 0, cycle: rolled.cycle };
  return {
    freezesLeft: Math.max(0, PREMIUM_FREEZES_PER_MONTH - rolled.freezesUsed),
    repairsLeft: Math.max(0, PREMIUM_REPAIRS_PER_MONTH - rolled.repairsUsed),
    cycle: rolled.cycle,
  };
}

export type StreakSnapshot = { streak: number; best: number; lastDay: string; freezes: number };

export type ProtectionResult = {
  next: StreakSnapshot;
  allowance: MonthlyAllowance;
  used: "none" | "freeze" | "repair";
};

/**
 * Auto-applied premium streak protection, evaluated BEFORE the normal streak
 * rules run. A 1-day gap eats a Freeze; a 2-day gap eats a Repair. Both are
 * silent and automatic — the user never has to remember to click anything.
 */
export function applyStreakProtection(
  s: StreakSnapshot,
  allowance: MonthlyAllowance | null | undefined,
  premium: boolean,
  today = pktDayKey()
): ProtectionResult {
  const rolled = rollAllowance(allowance, today);
  if (!premium || !s.lastDay || s.lastDay === today || s.streak <= 0) {
    return { next: s, allowance: rolled, used: "none" };
  }
  const gap = daysBetween(s.lastDay, today);
  if (gap <= 1) return { next: s, allowance: rolled, used: "none" };

  const { freezesLeft, repairsLeft } = monthlyAllowance(rolled, true, today);

  // 1 missed day → freeze
  if (gap === 2 && freezesLeft > 0) {
    return {
      next: { ...s, lastDay: pktDayOffset(-1, today) },
      allowance: { ...rolled, freezesUsed: rolled.freezesUsed + 1 },
      used: "freeze",
    };
  }
  // 2–7 missed days → repair (once a month)
  if (gap > 2 && gap <= 8 && repairsLeft > 0) {
    return {
      next: { ...s, lastDay: pktDayOffset(-1, today) },
      allowance: { ...rolled, repairsUsed: rolled.repairsUsed + 1 },
      used: "repair",
    };
  }
  return { next: s, allowance: rolled, used: "none" };
}

/* ------------------------------------------------------------------ */
/* Coins                                                               */
/* ------------------------------------------------------------------ */

/** Premium earns 2× daily reward coins. Gameplay coins stay equal for everyone. */
export function dailyCoinMultiplier(premium: boolean): number {
  return premium ? 2 : 1;
}

/** Extra premium-only daily chest, on top of the normal 7-day cycle. */
export const PREMIUM_CHEST_COINS = 25;
export const PREMIUM_CHEST_XP = 10;
