"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  registerPlay,
  levelFromXp,
  xpForGame,
  coinsForGame,
  evalBadges,
  bumpUsage,
  isLimitReached,
  remainingToday,
  DAILY_REWARDS,
  type BadgeStats,
  type BadgeDef,
  type GameResultInput,
} from "./gamification";
import { BADGES } from "@/data/badges";
import { pktDayKey } from "./utils";

export type LangKey = "en" | "roman" | "ur";
export type Zone = "learn" | "brain" | "quiz" | "fun";

export type GameRecord = {
  slug: string;
  zone: Zone;
  score: number;
  maxScore: number;
  xp: number;
  at: number;
};

export type ShopItem = "hint" | "heart" | "freeze";

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
  /* daily */
  daily: { date: string; games: number; lessons: number };
  lastRewardDay: string | null;
  rewardCycleDay: number; // 0..6 index into DAILY_REWARDS
  /* content */
  badges: string[];
  results: GameRecord[];
  wordsLearned: string[]; // word ids
  quizCorrect: number;
  perfectScores: number;
  flags: Record<string, boolean>;
  /* account */
  premium: boolean;
  premiumExpiry: string | null;
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
  canPlay: (zone: Zone) => { ok: boolean; reason?: string };
  limitInfo: () => { games: number; lessons: number };
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
  daily: { date: pktDayKey(), games: 0, lessons: 0 },
  lastRewardDay: null,
  rewardCycleDay: 0,
  badges: [],
  results: [],
  wordsLearned: [],
  quizCorrect: 0,
  perfectScores: 0,
  flags: {},
  premium: false,
  premiumExpiry: null,
  sound: true,
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
        const streakRes = registerPlay(
          { streak: s.streak, best: s.bestStreak, lastDay: s.lastPlayDay, freezes: s.freezes },
          today
        );
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
          daily: bumpUsage(s.daily, zone === "learn" ? "learn" : "other", today),
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
        set({
          coins: s.coins + reward.coins,
          xp: s.xp + reward.xp,
          freezes: s.freezes + (isLast ? 1 : 0),
          lastRewardDay: today,
          rewardCycleDay: (s.rewardCycleDay + 1) % 7,
        });
        return { coins: reward.coins, xp: reward.xp, freeze: isLast, label: reward.label };
      },

      canPlay: (zone) => {
        const s = get();
        return {
          ok: !isLimitReached(s.daily, zone === "learn" ? "learn" : "other", s.premium),
          reason: isLimitReached(s.daily, zone === "learn" ? "learn" : "other", s.premium)
            ? zone === "learn"
              ? "Aaj ke 3 free lessons pooray ho gaye! Premium par unlimited lessons milte hain."
              : "Aaj ke 5 free games pooray ho gaye! Kal phir khelo ya Premium lo."
            : undefined,
        };
      },

      limitInfo: () => {
        const s = get();
        return remainingToday(s.daily, s.premium);
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

      resetProgress: () => set({ ...initialPlayer, daily: { date: pktDayKey(), games: 0, lessons: 0 } }),
    }),
    {
      name: "learnplay-player",
      version: 1,
      // guest uid merge into v0 persisted state (old key had `uid: null`, no isPremium field)
      migrate: (persisted) => {
        const s = persisted as Partial<PlayerState> & { uid?: string | null };
        return {
          ...s,
          uid: s.uid && !s.uid.startsWith("guest") ? s.uid : guestKey(),
          premium: s.premium ?? false,
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
    premium: s.premium,
    premiumExpiry: s.premiumExpiry,
  };
}
