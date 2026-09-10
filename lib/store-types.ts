/**
 * Shared player types — importable from server code (no "use client" here).
 * `lib/store.ts` re-exports these so existing imports keep working.
 */

export type LangKey = "en" | "roman" | "ur";
export type Zone = "learn" | "brain" | "quiz" | "fun";

/**
 * Per-language progress. Kept flat + primitive-friendly so Zustand selectors
 * never return fresh objects.
 */
export type LangProgress = {
  xp: number;
  words: number;
  plays: number;
  /** epoch ms of the last lesson played in this language */
  last: number;
};

export type GameRecord = {
  slug: string;
  zone: Zone;
  score: number;
  maxScore: number;
  xp: number;
  at: number;
};

export type ShopItem = "hint" | "heart" | "freeze";
