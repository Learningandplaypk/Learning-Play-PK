import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import * as gamification from "@/lib/gamification";
import { registerPlay } from "@/lib/gamification";

/**
 * Guard rails for the "everything free" promise.
 * If any of these fail, a limit has crept back into the product.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("no daily limits exist", () => {
  it("gamification exports no limit helpers or constants", () => {
    const names = Object.keys(gamification);
    for (const dead of [
      "FREE_DAILY_GAMES",
      "FREE_DAILY_LESSONS",
      "isLimitReached",
      "remainingToday",
      "bumpUsage",
      "freshUsage",
    ]) {
      expect(names).not.toContain(dead);
    }
  });

  it("the store exposes no canPlay/limitInfo gate and no daily usage counter", () => {
    const src = read("lib/store.ts");
    expect(src).not.toMatch(/\bcanPlay\b/);
    expect(src).not.toMatch(/\blimitInfo\b/);
    expect(src).not.toMatch(/daily:\s*\{\s*date/);
  });

  it("no component checks a play limit or renders a limit upsell", () => {
    const shell = read("components/game-shell.tsx");
    expect(shell).not.toMatch(/canPlay/);
    expect(shell).not.toMatch(/free limit khatam/i);
    // starting a game must be unconditional
    expect(shell).toMatch(/No limits/);
  });

  it("the learn path has no locked lesson state", () => {
    const path = read("components/zones/learn-path-client.tsx");
    // strip comments so the explanatory "no locked state" note doesn't match
    const code = path.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/"locked"/);
    expect(code).not.toMatch(/<Chip>Locked<\/Chip>/);
    expect(code).not.toMatch(/\bLock\b/);
  });

  it("50 plays in the same day all succeed and never reduce a quota", () => {
    // registerPlay is the only per-day bookkeeping left; it is idempotent
    let s = { streak: 1, best: 1, lastDay: "2026-09-08", freezes: 0 };
    for (let i = 0; i < 50; i++) {
      const r = registerPlay(s, "2026-09-08");
      s = r.next;
      expect(r.streakUp).toBe(false);
    }
    expect(s.streak).toBe(1);
  });

  it("public copy no longer advertises 5 games / 3 lessons limits", () => {
    for (const f of [
      "components/home/home-client.tsx",
      "components/zone-grid.tsx",
      "app/(legal)/terms/page.tsx",
      "components/game-shell.tsx",
    ]) {
      const src = read(f);
      expect(src).not.toMatch(/roz 5 games/i);
      expect(src).not.toMatch(/3 free lessons/i);
    }
  });
});
