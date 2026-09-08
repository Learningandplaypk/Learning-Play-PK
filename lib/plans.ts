/**
 * Plans + pricing — single source of truth (PKR).
 *
 * Philosophy: everything on Learn & Play PK is free. Premium buys a nicer
 * experience (no ads, unlimited hearts, reports, certificates, cosmetics),
 * never access to content. No countdown timers, no fake scarcity.
 */

export type PlanId = "free" | "premium-monthly" | "premium-yearly";

export type Plan = {
  id: PlanId;
  name: string;
  /** Price in PKR for the whole billing period. */
  amount: number;
  period: "forever" | "month" | "year";
  /** Roman-Urdu period label used in the UI. */
  periodLabel: string;
  months: number;
  badge?: string;
  note?: string;
  /** Yearly only — free trial length in days (0 = none). */
  trialDays: number;
};

export const PRICE_PKR = {
  monthly: 299,
  yearly: 999,
} as const;

/** Rs. 83/mah — rounded down, the honest way to show a yearly plan. */
export const YEARLY_MONTHLY_EQUIV = Math.floor(PRICE_PKR.yearly / 12); // 83

/** 72% bachat vs paying monthly for 12 months. */
export const YEARLY_SAVING_PCT = Math.round(
  (1 - PRICE_PKR.yearly / (PRICE_PKR.monthly * 12)) * 100
); // 72

export const TRIAL_DAYS_YEARLY = 7;

/** Days after premiumExpiry during which access continues (payment retries etc). */
export const GRACE_DAYS = 3;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    amount: 0,
    period: "forever",
    periodLabel: "hamesha",
    months: 0,
    note: "Saare games, saare levels, saari zubanein — hamesha free.",
    trialDays: 0,
  },
  "premium-monthly": {
    id: "premium-monthly",
    name: "Premium Monthly",
    amount: PRICE_PKR.monthly,
    period: "month",
    periodLabel: "/mahina",
    months: 1,
    note: "Kabhi bhi cancel karo.",
    trialDays: 0,
  },
  "premium-yearly": {
    id: "premium-yearly",
    name: "Premium Yearly",
    amount: PRICE_PKR.yearly,
    period: "year",
    periodLabel: "/saal",
    months: 12,
    badge: "Sab se popular",
    note: `Rs. ${YEARLY_MONTHLY_EQUIV}/mah · ${YEARLY_SAVING_PCT}% bachat`,
    trialDays: TRIAL_DAYS_YEARLY,
  },
};

export const PAID_PLAN_IDS: PlanId[] = ["premium-monthly", "premium-yearly"];

export function isPaidPlan(id: string): id is "premium-monthly" | "premium-yearly" {
  return id === "premium-monthly" || id === "premium-yearly";
}

export function planMonths(id: string): number {
  return id === "premium-yearly" ? 12 : 1;
}

/** Server-authoritative amount in PKR. Client-supplied amounts are ignored. */
export function planAmount(id: string): number {
  return isPaidPlan(id) ? PLANS[id].amount : 0;
}

export function planLabel(id: string): string {
  return isPaidPlan(id) ? `Learn & Play PK ${PLANS[id].name}` : "Learn & Play PK";
}

/* ------------------------------------------------------------------ */
/* Feature flags                                                       */
/* ------------------------------------------------------------------ */

export const FEATURES = {
  /** Family plan — NOT in scope yet. Flip when we build seat management. */
  familyPlan: false,
  /** 7-day free trial on the yearly plan (card / wallet required). */
  yearlyTrial: true,
} as const;

/* ------------------------------------------------------------------ */
/* Free vs Premium comparison — used by /premium                       */
/* ------------------------------------------------------------------ */

export type CompareRow = { feature: string; free: string; premium: string };

/**
 * Honest table: the free column is full of ✓ on purpose. If a row ever reads
 * "locked" for free users, we have broken the promise.
 */
export const COMPARE_ROWS: CompareRow[] = [
  { feature: "Saare 43 games", free: "✓", premium: "✓" },
  { feature: "Saari 8 zubanein, saare levels", free: "✓", premium: "✓" },
  { feature: "Roz kitne games / lessons", free: "Unlimited", premium: "Unlimited" },
  { feature: "XP, streak, badges, leaderboard", free: "✓", premium: "✓" },
  { feature: "Progress cloud sync", free: "✓", premium: "✓" },
  { feature: "Ads", free: "Halke banners (consent ke baad)", premium: "Bilkul zero" },
  { feature: "Lesson hearts", free: "5, har ghante 1 wapas", premium: "Unlimited" },
  { feature: "Streak freeze", free: "Coins se kharido", premium: "2 har mahine (auto)" },
  { feature: "Streak repair", free: "—", premium: "1 har mahine (auto)" },
  { feature: "Detailed progress report", free: "Basic stats", premium: "Full report + weekly email" },
  { feature: "Mistakes review practice", free: "—", premium: "✓" },
  { feature: "PDF certificate", free: "—", premium: "✓" },
  { feature: "Offline lesson packs", free: "—", premium: "✓" },
  { feature: "Exclusive avatars / frames / themes", free: "—", premium: "6 + 3 + 2" },
  { feature: "Daily coins", free: "1×", premium: "2× + premium chest" },
  { feature: "Support", free: "Email — 48 ghante", premium: "WhatsApp priority" },
  { feature: "Qeemat", free: "Rs. 0", premium: `Rs. ${PRICE_PKR.monthly}/mah ya Rs. ${PRICE_PKR.yearly}/saal` },
];

export const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Kya free plan mein kuch bhi locked hai?",
    a: "Nahi. Saare games, saare levels, saari zubanein, leaderboard, XP, streak aur badges free hain — hamesha. Premium sirf tajurba behtar banata hai (ads nahi, unlimited hearts, reports, certificate).",
  },
  {
    q: "Cancel kaise karun?",
    a: "Kabhi bhi. /account page par 'Manage subscription' se ya salam@learnplaypk.com par email karke. Cancel karne ke baad bhi jitna period paid hai utna premium chalta rahega — foran band nahi hota.",
  },
  {
    q: "Refund milta hai?",
    a: "Haan — pehle 7 din ke andar poora refund, koi sawal nahi. Email karo aur 3-5 working din mein wapas.",
  },
  {
    q: "Premium khatam ho jaye to meri progress ka kya hoga?",
    a: "Kuch nahi hota. XP, streak, badges, words — sab aapka rehta hai. Sirf premium comfort features (zero ads, unlimited hearts, reports) band ho jate hain. Content phir bhi poora khula rehta hai.",
  },
  {
    q: "7-din ka free trial kaise chalta hai?",
    a: "Sirf yearly plan par. Card ya wallet add karna zaroori hai, lekin trial ke doran kuch charge nahi hota — 7 din ke andar cancel kar do to zero payment.",
  },
  {
    q: "Payment kaise karun?",
    a: "JazzCash, EasyPaisa ya koi bhi Pakistani debit/credit card (Safepay ke zariye). International cards ke liye Stripe. Hum aapke card details kabhi store nahi karte.",
  },
];
