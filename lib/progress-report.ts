/**
 * Progress report analytics — pure functions over the local result history.
 * Used by /progress and by the weekly Resend email.
 */

import type { GameRecord } from "./store-types";
import { pktDayKey, pktDayOffset } from "./utils";

export type TopicAccuracy = {
  slug: string;
  zone: string;
  plays: number;
  /** 0..1 average of score/maxScore */
  accuracy: number;
  bestScore: number;
  xp: number;
};

export function accuracyByTopic(results: GameRecord[]): TopicAccuracy[] {
  const map = new Map<string, { zone: string; plays: number; sum: number; best: number; xp: number }>();
  for (const r of results) {
    const cur = map.get(r.slug) ?? { zone: r.zone, plays: 0, sum: 0, best: 0, xp: 0 };
    cur.plays += 1;
    cur.sum += r.maxScore > 0 ? Math.min(1, r.score / r.maxScore) : 0;
    cur.best = Math.max(cur.best, r.score);
    cur.xp += r.xp;
    map.set(r.slug, cur);
  }
  return Array.from(map, ([slug, v]) => ({
    slug,
    zone: v.zone,
    plays: v.plays,
    accuracy: v.plays ? v.sum / v.plays : 0,
    bestScore: v.best,
    xp: v.xp,
  })).sort((a, b) => b.plays - a.plays);
}

export type DayBucket = { day: string; xp: number; plays: number };

/** Last `days` PKT days, oldest first — the weekly chart. */
export function xpByDay(results: GameRecord[], days = 7, today = pktDayKey()): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) buckets.push({ day: pktDayOffset(-i, today), xp: 0, plays: 0 });
  const index = new Map(buckets.map((b, i) => [b.day, i]));
  for (const r of results) {
    const key = pktDayKey(new Date(r.at));
    const i = index.get(key);
    if (i !== undefined) {
      buckets[i].xp += r.xp;
      buckets[i].plays += 1;
    }
  }
  return buckets;
}

export type ReportSummary = {
  plays: number;
  xp: number;
  /** Rough minutes: we don't track wall-clock, so 3 min per session is the honest estimate. */
  minutes: number;
  avgAccuracy: number;
  bestDay: DayBucket | null;
  weakest: TopicAccuracy[];
  strongest: TopicAccuracy[];
};

export const MINUTES_PER_SESSION = 3;

export function summarize(results: GameRecord[], sinceDays = 7, today = pktDayKey()): ReportSummary {
  const from = pktDayOffset(-(sinceDays - 1), today);
  const recent = results.filter((r) => pktDayKey(new Date(r.at)) >= from);
  const topics = accuracyByTopic(recent);
  const days = xpByDay(recent, sinceDays, today);
  const xp = recent.reduce((s, r) => s + r.xp, 0);
  const avg = topics.length ? topics.reduce((s, t) => s + t.accuracy, 0) / topics.length : 0;
  const ranked = [...topics].filter((t) => t.plays >= 1).sort((a, b) => a.accuracy - b.accuracy);
  return {
    plays: recent.length,
    xp,
    minutes: recent.length * MINUTES_PER_SESSION,
    avgAccuracy: avg,
    bestDay: days.reduce<DayBucket | null>((best, d) => (!best || d.xp > best.xp ? d : best), null),
    weakest: ranked.slice(0, 3),
    strongest: ranked.slice(-3).reverse(),
  };
}

/** Plain-text weekly digest body (used by the Resend email). */
export function weeklyEmailText(name: string, s: ReportSummary, streak: number): string {
  const lines = [
    `Salam ${name || "dost"}!`,
    "",
    `Is hafte aap ne ${s.plays} sessions khele aur ${s.xp} XP kamaye (~${s.minutes} minute).`,
    `Streak: ${streak} din.`,
    `Average accuracy: ${Math.round(s.avgAccuracy * 100)}%.`,
  ];
  if (s.strongest.length) lines.push("", `Sab se acha: ${s.strongest.map((t) => t.slug).join(", ")}.`);
  if (s.weakest.length) lines.push(`Thora aur mehnat: ${s.weakest.map((t) => t.slug).join(", ")}.`);
  lines.push(
    "",
    "Poori report: https://learnplaypk.com/progress",
    "",
    "Yeh email har Pir ko aata hai. Band karna ho to /account par ek click.",
  );
  return lines.join("\n");
}
