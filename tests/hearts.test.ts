import { describe, it, expect } from "vitest";
import {
  MAX_HEARTS,
  REFILL_MS,
  addHearts,
  currentHearts,
  formatWait,
  freshHearts,
  msToNextHeart,
  settleHearts,
  spendHeart,
} from "@/lib/hearts";
import { recordMistake, recordReviewHit, buildPracticeSet, weakWords, CLEAR_AFTER_HITS } from "@/lib/mistakes";
import { accuracyByTopic, summarize, xpByDay } from "@/lib/progress-report";
import type { GameRecord } from "@/lib/store-types";

const T0 = 1_757_000_000_000;

describe("hearts", () => {
  it("premium always has unlimited hearts and never spends one", () => {
    expect(currentHearts({ hearts: 0, at: T0 }, true, T0)).toBe(Infinity);
    const after = spendHeart({ hearts: 0, at: T0 }, true, T0);
    expect(currentHearts(after, true, T0)).toBe(Infinity);
  });

  it("free users start with 5 and lose one per mistake", () => {
    let s = freshHearts(T0);
    expect(currentHearts(s, false, T0)).toBe(MAX_HEARTS);
    s = spendHeart(s, false, T0);
    s = spendHeart(s, false, T0);
    expect(currentHearts(s, false, T0)).toBe(MAX_HEARTS - 2);
  });

  it("never goes below zero", () => {
    let s = freshHearts(T0);
    for (let i = 0; i < 10; i++) s = spendHeart(s, false, T0);
    expect(currentHearts(s, false, T0)).toBe(0);
  });

  it("refills one heart per hour, capped at the max", () => {
    let s = freshHearts(T0);
    for (let i = 0; i < 5; i++) s = spendHeart(s, false, T0);
    expect(currentHearts(s, false, T0 + REFILL_MS - 1)).toBe(0);
    expect(currentHearts(s, false, T0 + REFILL_MS)).toBe(1);
    expect(currentHearts(s, false, T0 + 3 * REFILL_MS)).toBe(3);
    expect(currentHearts(s, false, T0 + 99 * REFILL_MS)).toBe(MAX_HEARTS);
  });

  it("a rewarded ad grants +1 without exceeding the cap", () => {
    let s = freshHearts(T0);
    s = spendHeart(s, false, T0);
    s = addHearts(s, 1, false, T0);
    expect(currentHearts(s, false, T0)).toBe(MAX_HEARTS);
    s = addHearts(s, 3, false, T0);
    expect(currentHearts(s, false, T0)).toBe(MAX_HEARTS);
  });

  it("reports the wait until the next heart", () => {
    let s = freshHearts(T0);
    s = spendHeart(s, false, T0);
    expect(msToNextHeart(s, false, T0)).toBeGreaterThan(0);
    expect(msToNextHeart(s, true, T0)).toBe(0);
    expect(formatWait(0)).toBe("abhi");
    expect(formatWait(30 * 60 * 1000)).toBe("30 min");
  });

  it("settling is stable when no time has passed", () => {
    const s = { hearts: 2, at: T0 };
    expect(settleHearts(s, false, T0)).toEqual(s);
  });
});

describe("mistakes review", () => {
  const m = { topic: "english", prompt: "apple", correct: "seb" };

  it("records and counts repeats", () => {
    let list = recordMistake([], m, T0);
    list = recordMistake(list, m, T0 + 1);
    expect(list).toHaveLength(1);
    expect(list[0].misses).toBe(2);
  });

  it(`clears after ${CLEAR_AFTER_HITS} correct reviews`, () => {
    let list = recordMistake([], m, T0);
    const id = list[0].id;
    list = recordReviewHit(list, id);
    expect(list).toHaveLength(1);
    list = recordReviewHit(list, id);
    expect(list).toHaveLength(0);
  });

  it("practice set is worst-first", () => {
    let list = recordMistake([], { topic: "english", prompt: "a", correct: "1" }, T0);
    list = recordMistake(list, { topic: "english", prompt: "b", correct: "2" }, T0);
    list = recordMistake(list, { topic: "english", prompt: "b", correct: "2" }, T0);
    expect(buildPracticeSet(list, 2)[0].prompt).toBe("b");
  });

  it("weak words exclude quiz topics", () => {
    let list = recordMistake([], { topic: "quiz-gk", prompt: "q", correct: "a" }, T0);
    list = recordMistake(list, m, T0);
    expect(weakWords(list).every((x) => !x.topic.startsWith("quiz"))).toBe(true);
  });
});

describe("progress report", () => {
  const day = (k: string) => Date.parse(`${k}T06:00:00Z`);
  const results: GameRecord[] = [
    { slug: "memory", zone: "brain", score: 5, maxScore: 10, xp: 30, at: day("2026-09-08") },
    { slug: "memory", zone: "brain", score: 10, maxScore: 10, xp: 60, at: day("2026-09-07") },
    { slug: "quiz", zone: "quiz", score: 2, maxScore: 10, xp: 20, at: day("2026-09-06") },
  ];

  it("computes accuracy per topic", () => {
    const t = accuracyByTopic(results);
    const memory = t.find((x) => x.slug === "memory")!;
    expect(memory.plays).toBe(2);
    expect(memory.accuracy).toBeCloseTo(0.75);
  });

  it("buckets XP into the last 7 days, oldest first", () => {
    const days = xpByDay(results, 7, "2026-09-08");
    expect(days).toHaveLength(7);
    expect(days[6].day).toBe("2026-09-08");
    expect(days[6].xp).toBe(30);
  });

  it("summarizes the week", () => {
    const s = summarize(results, 7, "2026-09-08");
    expect(s.plays).toBe(3);
    expect(s.xp).toBe(110);
    expect(s.minutes).toBeGreaterThan(0);
    expect(s.weakest[0].slug).toBe("quiz");
  });
});
