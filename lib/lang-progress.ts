import { levelFromXp } from "./gamification";
import type { LangProgress } from "./store-types";
import { LANG_REGISTRY, getLangMeta, type LangMeta } from "./lang-registry";

/**
 * Pure helpers around per-language progress — no React, no store, so the rules
 * are testable and shared by the hub, the picker, the profile and the
 * leaderboard filter.
 */

export const EMPTY_PROGRESS: LangProgress = { xp: 0, words: 0, plays: 0, last: 0 };

export function progressFor(map: Record<string, LangProgress> | undefined, slug: string): LangProgress {
  return map?.[slug] ?? EMPTY_PROGRESS;
}

export type LangStat = LangProgress & { level: number; title: string };

export function langStat(map: Record<string, LangProgress> | undefined, slug: string): LangStat {
  const p = progressFor(map, slug);
  const lv = levelFromXp(p.xp);
  return { ...p, level: lv.level, title: `Level ${lv.level}` };
}

/**
 * Only registered languages survive: a stale localStorage entry for a language
 * we later renamed must never 404 the hub. English is always the floor.
 */
export function displayLearningLanguages(
  learningLanguages: string[] | undefined,
  registry: LangMeta[] = LANG_REGISTRY
): LangMeta[] {
  const known = new Set(registry.map((l) => l.slug));
  const picked = (learningLanguages ?? []).filter((s) => known.has(s));
  const list = picked.length ? picked : ["english"];
  // stable order: registry order, so the hub never reshuffles between renders
  return registry.filter((l) => list.includes(l.slug));
}

export function totalWordsLearned(map: Record<string, LangProgress> | undefined, slugs: string[]): number {
  return slugs.reduce((sum, s) => sum + progressFor(map, s).words, 0);
}

export function mostRecentLang(
  map: Record<string, LangProgress> | undefined,
  slugs: string[]
): string | null {
  let best: string | null = null;
  let bestAt = 0;
  for (const s of slugs) {
    const p = progressFor(map, s);
    if (p.last > bestAt) {
      bestAt = p.last;
      best = s;
    }
  }
  return best;
}

/** "Continue learning" target: last-played language, else the first picked one. */
export function continueLang(
  lastLearnLang: string | null,
  learningLanguages: string[] | undefined
): string {
  const langs = displayLearningLanguages(learningLanguages).map((l) => l.slug);
  if (lastLearnLang && langs.includes(lastLearnLang)) return lastLearnLang;
  return langs[0];
}

export { getLangMeta };
