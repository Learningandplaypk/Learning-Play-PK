"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  registerPlay,
  levelFromXp,
  xpForGame,
  coinsForGame,
  evalBadges,
  DAILY_REWARDS,
  type BadgeStats,
  type BadgeDef,
  type GameResultInput,
} from "./gamification";
import {
  applyStreakProtection,
  dailyCoinMultiplier,
  entitlementStatus,
  freshAllowance,
  isPremiumActive,
  monthlyAllowance,
  rollAllowance,
  PREMIUM_CHEST_COINS,
  PREMIUM_CHEST_XP,
  type MonthlyAllowance,
} from "./entitlements";
import { addHearts, freshHearts, settleHearts, spendHeart, type HeartsState } from "./hearts";
import { recordMistake, recordReviewHit, type Mistake } from "./mistakes";
import { BADGES } from "@/data/badges";
import { pktDayKey } from "./utils";
import type { GameRecord, LangKey, ShopItem, Zone } from "./store-types";

export type { GameRecord, LangKey, ShopItem, Zone };

export type PlayerState = {
  /* identity */
  name: string;
  avatar: string; // emoji
  uid: string | null; // firebase uid once logged in
  /* gamification */
  xp: number;
  coins: number;
  streak: number;
  bestStreak: number;
  freezes: number;
  lastPlayDay: string;
  hints: number;
  /* hearts — comfort only; running out never blocks content */
  heartsState: HeartsState;
  /* daily */
  lastRewardDay: string | null;
  rewardCycleDay: number; // 0..6 index into DAILY_REWARDS
  /* content */
  badges: string[];
  results: GameRecord[];
  wordsLearned: string[]; // word ids
  quizCorrect: number;
  perfectScores: number;
  flags: Record<string, boolean>;
  /* mistakes review */
  mistakes: Mistake[];
  /* account — entitlement mirror; the server is always authoritative */
  premium: boolean;
  premiumExpiry: string | null;
  premiumPlan: string | null;
  premiumProvider: string | null;
  trialEnd: string | null;
  /** Monthly streak-freeze / repair allowance (premium). */
  allowance: MonthlyAllowance;
  /* cosmetics */
  frame: string;
  themeSkin: string;
  /* settings */
  sound: boolean;
  lang: LangKey;
  lowQuality: boolean;
  consentAds: boolean | null;
  onboarded: boolean;
};

export type LastGameOutcome = {
  slug: string;
  zone: Zone;
  score: number;
  maxScore: number;
  xp: number;
  coins: number;
  leveledTo: number | null;
  newBadges: BadgeDef[];
  perfect: boolean;
};

type Store = PlayerState & {
  hydrated: boolean;
  outcome: LastGameOutcome | null;
  toasts: Array<{ id: number; emoji: string; title: string; body?: string }>;
  setPlayer: (p: Partial<PlayerState>) => void;
  toast: (emoji: string, title: string, body?: string) => void;
  dismissToast: (id: number) => void;
  submitGame: (args: { slug: string; zone: Zone; result: GameResultInput; flag?: string; words?: string[]; quizCorrect?: number }) => LastGameOutcome;
  spendCoins: (amount: number) => boolean;
  buyItem: (item: ShopItem) => boolean;
  claimDailyReward: () => { coins: number; xp: number; freeze: boolean; label: string } | null;
  /** Premium right now (expiry + 3-day grace applied). */
  isPremium: () => boolean;
  hearts: () => number;
  useHeart: () => number;
  grantHearts: (n: number) => void;
  addMistake: (m: { topic: string; prompt: string; correct: string; given?: string }) => void;
  clearMistake: (id: string) => void;
  allowanceLeft: () => { freezesLeft: number; repairsLeft: number; cycle: string };
  mergeGuest: (guest: Partial<PlayerState>) => void;
  resetProgress: () => void;
};

const AVATARS = ["🦉", "🐯", "🦄", "🐉", "🦅", "🐺", "🦁", "🐨", "🦊", "🐸", "🦋", "⭐"];

export const AVATAR_CHOICES = AVATARS;

function guestKey(): string {
  try {
    const k = localStorage.getItem("lpk-guest-uid");
    if (k) return k;
    const g = `guest-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("lpk-guest-uid", g);
    return g;
  } catch {
    return "guest";
  }
}

const initialPlayer: PlayerState = {
  name: "",
  avatar: "🦉",
  uid: null,
  xp: 0,
  coins: 25,
  streak: 0,
  bestStreak: 0,
  freezes: 0,
  lastPlayDay: "",
  hints: 3,
  heartsState: { hearts: 5, at: 0 },
  lastRewardDay: null,
  rewardCycleDay: 0,
  badges: [],
  results: [],
  wordsLearned: [],
  quizCorrect: 0,
  perfectScores: 0,
  flags: {},
  mistakes: [],
  premium: false,
  premiumExpiry: null,
  premiumPlan: null,
  premiumProvider: null,
  trialEnd: null,
  allowance: { cycle: "", freezesUsed: 0, repairsUsed: 0 },
  frame: "none",
  themeSkin: "default",
  sound: false,
  lang: "roman",
  lowQuality: false,
  consentAds: null,
  onboarded: false,
};

export const usePlayer = create<Store>()(
  persist(
    (set, get) => ({
      ...initialPlayer,
      hydrated: false,
      outcome: null,
      toasts: [],
      setPlayer: (p) => set(p),
      toast: (emoji, title, body) => {
        const id = Date.now() + Math.random();
        set((s) => ({ toasts: [...s.toasts, { id, emoji, title, body }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      submitGame: ({ slug, zone, result, flag, words, quizCorrect }) => {
        const s = get();
        const today = pktDayKey();
        const premium = isPremiumActive(
          { isPremium: s.premium, premiumExpiry: s.premiumExpiry, premiumPlan: s.premiumPlan, trialEnd: s.trialEnd },
          today
        );
        // premium streak protection runs first (2 freezes + 1 repair per month, automatic)
        const protection = applyStreakProtection(
          { streak: s.streak, best: s.bestStreak, lastDay: s.lastPlayDay, freezes: s.freezes },
          s.allowance,
          premium,
          today
        );
        const streakRes = registerPlay(protection.next, today);
        const xp = xpForGame(result);
        const coins = coinsForGame(xp, result);
        const perfect = result.maxScore > 0 && result.score >= result.maxScore;
        const totalXp = s.xp + xp;
        const beforeLevel = levelFromXp(s.xp).level;
        const afterLevel = levelFromXp(totalXp).level;

        const wordsLearned = Array.from(new Set([...s.wordsLearned, ...(words ?? [])]));
        const flags = flag ? { ...s.flags, [flag]: true } : s.flags;
        const perfectScores = s.perfectScores + (perfect ? 1 : 0);
        const quizCorrectTotal = s.quizCorrect + (quizCorrect ?? 0);
        const plays = s.results.length + 1;
        const lessons = zone === "learn" ? plays : 0;

        const stats: BadgeStats = {
          plays,
          lessons,
          perfectScores,
          totalXp,
          coinsEarned: s.coins + coins,
          streak: streakRes.next.streak,
          bestStreak: streakRes.next.best,
          level: afterLevel,
          wordsLearned: wordsLearned.length,
          quizCorrect: quizCorrectTotal,
          flags,
        };
        const newBadges = evalBadges(BADGES, stats, s.badges);

        const record: GameRecord = { slug, zone, score: result.score, maxScore: result.maxScore, xp, at: Date.now() };
        const results = [record, ...s.results].slice(0, 200);

        const outcome: LastGameOutcome = {
          slug,
          zone,
          score: result.score,
          maxScore: result.maxScore,
          xp,
          coins,
          leveledTo: afterLevel > beforeLevel ? afterLevel : null,
          newBadges,
          perfect,
        };

        set({
          xp: totalXp,
          coins: s.coins + coins,
          streak: streakRes.next.streak,
          bestStreak: streakRes.next.best,
          freezes: streakRes.next.freezes,
          lastPlayDay: streakRes.next.lastDay,
          allowance: protection.allowance,
          results,
          wordsLearned,
          flags,
          perfectScores,
          quizCorrect: quizCorrectTotal,
          badges: [...s.badges, ...newBadges.map((b) => b.id)],
          outcome,
        });
        return outcome;
      },

      spendCoins: (amount) => {
        const s = get();
        if (s.coins < amount) return false;
        set({ coins: s.coins - amount });
        return true;
      },

      buyItem: (item) => {
        const prices: Record<ShopItem, number> = { hint: 20, heart: 30, freeze: 60 };
        const s = get();
        if (!s.spendCoins(prices[item])) return false;
        if (item === "hint") set({ hints: get().hints + 1 });
        if (item === "freeze") set({ freezes: get().freezes + 1 });
        return true;
      },

      claimDailyReward: () => {
        const s = get();
        const today = pktDayKey();
        if (s.lastRewardDay === today) return null;
        const reward = DAILY_REWARDS[s.rewardCycleDay % 7];
        const isLast = s.rewardCycleDay % 7 === 6;
        const premium = s.isPremium();
        // premium: 2x daily coins + an extra daily chest
        const coins = reward.coins * dailyCoinMultiplier(premium) + (premium ? PREMIUM_CHEST_COINS : 0);
        const xp = reward.xp + (premium ? PREMIUM_CHEST_XP : 0);
        set({
          coins: s.coins + coins,
          xp: s.xp + xp,
          freezes: s.freezes + (isLast ? 1 : 0),
          lastRewardDay: today,
          rewardCycleDay: (s.rewardCycleDay + 1) % 7,
          allowance: rollAllowance(s.allowance),
        });
        return { coins, xp, freeze: isLast, label: premium ? `${reward.label} · 2× premium` : reward.label };
      },

      isPremium: () => {
        const s = get();
        return isPremiumActive({
          isPremium: s.premium,
          premiumExpiry: s.premiumExpiry,
          premiumPlan: s.premiumPlan,
          trialEnd: s.trialEnd,
        });
      },

      hearts: () => {
        const s = get();
        return s.isPremium() ? Infinity : settleHearts(s.heartsState, false).hearts;
      },

      useHeart: () => {
        const s = get();
        if (s.isPremium()) return Infinity;
        const next = spendHeart(s.heartsState, false);
        set({ heartsState: next });
        return next.hearts;
      },

      grantHearts: (n) => {
        const s = get();
        if (s.isPremium()) return;
        set({ heartsState: addHearts(s.heartsState, n, false) });
      },

      addMistake: (m) => set((st) => ({ mistakes: recordMistake(st.mistakes, m) })),

      clearMistake: (id) => set((st) => ({ mistakes: recordReviewHit(st.mistakes, id) })),

      allowanceLeft: () => {
        const s = get();
        return monthlyAllowance(s.allowance, s.isPremium());
      },

      mergeGuest: (guest) => {
        const s = get();
        set({
          xp: Math.max(s.xp, guest.xp ?? 0),
          coins: Math.max(s.coins, guest.coins ?? 0),
          // keep the larger gamified history when merging a guest snapshot into an account
          results: guest.results && guest.results.length > s.results.length ? guest.results : s.results,
          badges: Array.from(new Set([...s.badges, ...(guest.badges ?? [])])),
          wordsLearned: Array.from(new Set([...s.wordsLearned, ...(guest.wordsLearned ?? [])])),
          bestStreak: Math.max(s.bestStreak, guest.bestStreak ?? 0),
          streak: Math.max(s.streak, guest.streak ?? 0),
        });
      },

      resetProgress: () =>
        set({ ...initialPlayer, heartsState: freshHearts(), allowance: freshAllowance() }),
    }),
    {
      name: "learnplay-player",
      version: 2,
      /**
       * v2 — monetization rebuild: drops the dead `daily` usage counters (the
       * 5-games / 3-lessons limits no longer exist) and seeds hearts, the
       * monthly freeze/repair allowance, mistakes and cosmetics.
       */
      migrate: (persisted) => {
        const s = persisted as Partial<PlayerState> & { uid?: string | null; daily?: unknown };
        const { daily: _dropped, ...rest } = s;
        void _dropped;
        return {
          ...initialPlayer,
          ...rest,
          uid: s.uid && !s.uid.startsWith("guest") ? s.uid : guestKey(),
          premium: s.premium ?? false,
          heartsState: s.heartsState ?? freshHearts(),
          allowance: s.allowance ?? freshAllowance(),
          mistakes: s.mistakes ?? [],
          frame: s.frame ?? "none",
          themeSkin: s.themeSkin ?? "default",
        } as PlayerState;
      },
      // rehydrate manually after mount (see Providers) — avoids SSR/CSR hydration mismatch
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { toasts, outcome, hydrated, ...rest } = s;
        void toasts;
        void outcome;
        void hydrated;
        return rest as PlayerState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          usePlayer.setState({ hydrated: true, uid: state?.uid && !state.uid.startsWith("guest") ? state.uid : guestKey() });
        }
      },
    }
  )
);

/** Snapshot of pure player fields for Firestore sync / guest merge. */
export function playerSnapshot(s: PlayerState): Partial<PlayerState> {
  return {
    uid: s.uid,
    name: s.name,
    avatar: s.avatar,
    xp: s.xp,
    coins: s.coins,
    streak: s.streak,
    bestStreak: s.bestStreak,
    freezes: s.freezes,
    badges: s.badges,
    results: s.results,
    wordsLearned: s.wordsLearned,
    quizCorrect: s.quizCorrect,
    perfectScores: s.perfectScores,
    // entitlement fields are deliberately NOT included: only the payment
    // webhooks (Admin SDK) may write isPremium / premiumExpiry / premiumPlan.
    mistakes: s.mistakes.slice(0, 100),
    frame: s.frame,
    themeSkin: s.themeSkin,
    heartsState: s.heartsState,
    allowance: s.allowance,
  };
}

/** Apply a server-side entitlement document to the local mirror. */
export function applyEntitlement(e: {
  isPremium?: boolean;
  premiumExpiry?: string | null;
  premiumPlan?: string | null;
  premiumProvider?: string | null;
  trialEnd?: string | null;
}) {
  const status = entitlementStatus({
    isPremium: !!e.isPremium,
    premiumExpiry: e.premiumExpiry ?? null,
    premiumPlan: e.premiumPlan ?? null,
    trialEnd: e.trialEnd ?? null,
  });
  usePlayer.setState({
    premium: status.active,
    premiumExpiry: e.premiumExpiry ?? null,
    premiumPlan: e.premiumPlan ?? null,
    premiumProvider: e.premiumProvider ?? null,
    trialEnd: e.trialEnd ?? null,
  });
}
