import { pktDayKey, pktDayOffset, clamp } from "./utils";

/* ============================================================
   XP + LEVELS
   ============================================================ */

export const MAX_LEVEL = 50;

/** Total XP required to REACH level n (cumulative). Level 1 = 0 XP. */
export function xpForLevel(n: number): number {
  if (n <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= n; l++) total += Math.round(60 * Math.pow(l - 1, 1.35));
  return total;
}

/** Derive level (1..50) + progress within level from total XP. */
export function levelFromXp(xp: number): { level: number; into: number; need: number; progress: number } {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const need = level >= MAX_LEVEL ? 1 : xpForLevel(level + 1) - base;
  const into = xp - base;
  return { level, into, need: level >= MAX_LEVEL ? 0 : need, progress: level >= MAX_LEVEL ? 1 : clamp(into / need, 0, 1) };
}

const TITLES: Array<[number, string]> = [
  [1, "Newbie"], [4, "Seeker"], [8, "Learner"], [13, "Explorer"], [18, "Achiever"],
  [24, "Scholar"], [30, "Master"], [37, "Grandmaster"], [44, "Champion"], [49, "Legend"],
];

export function levelTitle(level: number): string {
  let t = TITLES[0][1];
  for (const [lv, name] of TITLES) if (level >= lv) t = name;
  return t;
}

export type GameResultInput = {
  score: number;
  maxScore: number;
  accuracy: number; // 0..1
  timeMs: number;
  correct?: number;
  total?: number;
};

/** XP earned from one game session: 20 base + up to 80 quality + up to 20 speed bonus. */
export function xpForGame(r: GameResultInput): number {
  const quality = r.maxScore > 0 ? clamp(r.score / r.maxScore, 0, 1) : 0;
  const acc = clamp(r.accuracy, 0, 1);
  const speed = clamp(1 - r.timeMs / 180000, 0, 1); // faster than 3min gets bonus
  return Math.round(20 + 80 * quality * (0.5 + 0.5 * acc) + 20 * speed * quality);
}

export function coinsForGame(xp: number, r: GameResultInput): number {
  const quality = r.maxScore > 0 ? clamp(r.score / r.maxScore, 0, 1) : 0;
  let coins = Math.round(xp / 4);
  if (quality >= 0.999 && r.maxScore > 0) coins += 5; // perfect bonus
  return coins;
}

/* ============================================================
   STREAK (timezone-safe, Asia/Karachi)
   ============================================================ */

export type StreakState = { streak: number; best: number; lastDay: string; freezes: number };

/** Call after any learning/play activity. Returns updated state + whether streak increased today. */
export function registerPlay(s: StreakState, today = pktDayKey()): { next: StreakState; streakUp: boolean; freezeUsed: boolean } {
  if (s.lastDay === today) return { next: s, streakUp: false, freezeUsed: false };
  const yesterday = pktDayOffset(-1, today);
  let streak = 1;
  let freezes = s.freezes;
  let freezeUsed = false;
  if (s.lastDay === yesterday) streak = s.streak + 1;
  else if (s.lastDay === pktDayOffset(-2, today) && freezes > 0) {
    // one missed day covered by a streak freeze
    freezes -= 1;
    freezeUsed = true;
    streak = s.streak + 1;
  }
  const next: StreakState = { streak, best: Math.max(s.best, streak), lastDay: today, freezes };
  return { next, streakUp: true, freezeUsed };
}

/* ============================================================
   DAILY LIMITS (free plan)
   ============================================================ */

export const FREE_DAILY_GAMES = 5;
export const FREE_DAILY_LESSONS = 3;

export type DailyUsage = { date: string; games: number; lessons: number };

export function freshUsage(today = pktDayKey()): DailyUsage {
  return { date: today, games: 0, lessons: 0 };
}

export function isLimitReached(usage: DailyUsage, zone: "learn" | "other", isPremium: boolean, today = pktDayKey()): boolean {
  if (isPremium) return false;
  const u = usage.date === today ? usage : freshUsage(today);
  return zone === "learn" ? u.lessons >= FREE_DAILY_LESSONS : u.games >= FREE_DAILY_GAMES;
}

export function remainingToday(usage: DailyUsage, isPremium: boolean, today = pktDayKey()): { games: number; lessons: number } {
  if (isPremium) return { games: Infinity, lessons: Infinity };
  const u = usage.date === today ? usage : freshUsage(today);
  return {
    games: Math.max(0, FREE_DAILY_GAMES - u.games),
    lessons: Math.max(0, FREE_DAILY_LESSONS - u.lessons),
  };
}

export function bumpUsage(usage: DailyUsage, zone: "learn" | "other", today = pktDayKey()): DailyUsage {
  const u = usage.date === today ? { ...usage } : freshUsage(today);
  if (zone === "learn") u.lessons += 1;
  else u.games += 1;
  return u;
}

/* ============================================================
   DAILY REWARDS — 7 day cycle
   ============================================================ */

export const DAILY_REWARDS: Array<{ day: number; coins: number; xp: number; label: string }> = [
  { day: 1, coins: 10, xp: 10, label: "10 🪙" },
  { day: 2, coins: 15, xp: 15, label: "15 🪙" },
  { day: 3, coins: 20, xp: 20, label: "20 🪙" },
  { day: 4, coins: 30, xp: 25, label: "30 🪙" },
  { day: 5, coins: 40, xp: 30, label: "40 🪙" },
  { day: 6, coins: 60, xp: 40, label: "60 🪙" },
  { day: 7, coins: 100, xp: 60, label: "100 🪙 + 🔥 Freeze" },
];

/* ============================================================
   BADGES — full definitions live in data/badges.ts; evaluated here.
   ============================================================ */

export type BadgeStats = {
  plays: number;
  lessons: number;
  perfectScores: number;
  totalXp: number;
  coinsEarned: number;
  streak: number;
  bestStreak: number;
  level: number;
  wordsLearned: number;
  quizCorrect: number;
  flags: Record<string, boolean>;
};

export function evalBadges(defs: BadgeDef[], stats: BadgeStats, owned: string[]): BadgeDef[] {
  return defs.filter((d) => !owned.includes(d.id) && d.cond(stats));
}

export type BadgeDef = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  cond: (s: BadgeStats) => boolean;
};
