import { describe, it, expect } from "vitest";
import { shuffle, rng, pktDayKey, pktDayOffset, fmt, isPhonePk } from "@/lib/utils";
import { registerPlay, isLimitReached, freshUsage, remainingToday, bumpUsage, DAILY_REWARDS } from "@/lib/gamification";

describe("utils", () => {
  it("shuffle is a permutation and seeded-stable", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = shuffle(arr, rng(42));
    const b = shuffle(arr, rng(42));
    expect(a).toEqual(b);
    expect(a.slice().sort((x, y) => x - y)).toEqual(arr);
    expect(shuffle(arr)).not.toEqual(arr); // practically never identity for 8 items
  });

  it("pktDayKey is Karachi-normalized (UTC+5)", () => {
    // 2026-09-03T18:30:00Z = 23:30 PKT same day
    expect(pktDayKey(new Date("2026-09-03T18:30:00Z"))).toBe("2026-09-03");
    // 2026-09-03T19:30:00Z = 00:30 PKT next day
    expect(pktDayKey(new Date("2026-09-03T19:30:00Z"))).toBe("2026-09-04");
    // 2026-09-03T16:29:00Z = 21:29 PKT same day
    expect(pktDayKey(new Date("2026-09-03T16:29:00Z"))).toBe("2026-09-03");
  });

  it("pktDayOffset walks days from a base day key", () => {
    expect(pktDayOffset(-1, "2026-09-03")).toBe("2026-09-02");
    expect(pktDayOffset(1, "2026-09-03")).toBe("2026-09-04");
  });

  it("fmt groups thousands", () => {
    expect(fmt(12345)).toMatch(/12[,.]?345/);
  });

  it("isPhonePk accepts Pakistani mobile numbers", () => {
    expect(isPhonePk("03001234567")).toBe(true);
    expect(isPhonePk("+923001234567")).toBe(true);
    expect(isPhonePk("923001234567")).toBe(true);
    expect(isPhonePk("12345")).toBe(false);
    expect(isPhonePk("0300123456")).toBe(false);
  });
});

describe("streak + limits", () => {
  it("consecutive-day play increments streak; gap without freeze resets", () => {
    let s = { streak: 0, best: 0, lastDay: "", freezes: 2 };
    const r1 = registerPlay(s, "2026-09-01");
    s = r1.next;
    expect(s.streak).toBe(1);
    const r2 = registerPlay(s, "2026-09-02");
    s = r2.next;
    expect(s.streak).toBe(2);
    // skip 3+ days → reset (freeze only saves 1-day gap)
    const r3 = registerPlay(s, "2026-09-06");
    s = r3.next;
    expect(s.streak).toBe(1);
    expect(s.best).toBe(2);
  });

  it("1-day gap eats a freeze and keeps the streak", () => {
    let s = { streak: 5, best: 5, lastDay: "2026-09-01", freezes: 1 };
    const r = registerPlay(s, "2026-09-03");
    expect(r.freezeUsed).toBe(true);
    expect(r.next.streak).toBe(6); // continued
    expect(r.next.freezes).toBe(0);
  });

  it("same-day replays don't double-count the streak", () => {
    let s = { streak: 3, best: 3, lastDay: "2026-09-01", freezes: 0 };
    const r = registerPlay(s, "2026-09-01");
    expect(r.next.streak).toBe(3);
    expect(r.streakUp).toBe(false);
  });

  it("free plan: 5 games/day, 3 lessons/day; premium unlimited", () => {
    let u = freshUsage("2026-09-03");
    for (let i = 0; i < 5; i++) u = bumpUsage(u, "other", "2026-09-03");
    expect(isLimitReached(u, "other", false, "2026-09-03")).toBe(true);
    expect(isLimitReached(u, "other", true, "2026-09-03")).toBe(false);
    let u2 = freshUsage("2026-09-03");
    for (let i = 0; i < 3; i++) u2 = bumpUsage(u2, "learn", "2026-09-03");
    expect(isLimitReached(u2, "learn", false, "2026-09-03")).toBe(true);
    const rem = remainingToday(u, false, "2026-09-03");
    expect(rem.games).toBe(0);
  });

  it("7 daily rewards defined with day cycle 1..7", () => {
    expect(DAILY_REWARDS.length).toBe(7);
    expect(DAILY_REWARDS.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
