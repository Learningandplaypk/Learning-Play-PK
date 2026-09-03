import { describe, it, expect } from "vitest";
import { xpForLevel, levelFromXp, levelTitle, xpForGame, MAX_LEVEL } from "@/lib/gamification";

describe("gamification XP curve", () => {
  it("level 1 costs 0 XP (you start there)", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("XP requirements are strictly increasing", () => {
    for (let l = 2; l <= MAX_LEVEL; l++) {
      expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1));
    }
  });

  it("levelFromXp is consistent with xpForLevel", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(xpForLevel(10)).level).toBe(10);
    expect(levelFromXp(xpForLevel(10) - 1).level).toBe(9);
  });

  it("caps at level 50 and progress in [0,1]", () => {
    const lv = levelFromXp(999_999_999);
    expect(lv.level).toBe(MAX_LEVEL);
    expect(lv.progress).toBeGreaterThanOrEqual(0);
    expect(lv.progress).toBeLessThanOrEqual(1);
  });

  it("titles ladder at documented levels", () => {
    expect(levelTitle(1)).toBe("Newbie");
    expect(levelTitle(8)).toBe("Learner");
    expect(levelTitle(24)).toBe("Scholar");
    expect(levelTitle(44)).toBe("Champion");
    expect(levelTitle(50)).toBe("Legend");
  });

  it("xpForGame: worst → base 20; perfect+instant → 120", () => {
    const worst = xpForGame({ score: 0, maxScore: 100, accuracy: 0, timeMs: 180000 });
    expect(worst).toBe(20);
    const best = xpForGame({ score: 100, maxScore: 100, accuracy: 1, timeMs: 0 });
    expect(best).toBe(120);
    const mid = xpForGame({ score: 50, maxScore: 100, accuracy: 0.5, timeMs: 90000 });
    expect(mid).toBeGreaterThan(worst);
    expect(mid).toBeLessThan(best);
  });

  it("xpForGame is deterministic", () => {
    const a = xpForGame({ score: 70, maxScore: 100, accuracy: 0.7, timeMs: 40000 });
    const b = xpForGame({ score: 70, maxScore: 100, accuracy: 0.7, timeMs: 40000 });
    expect(a).toBe(b);
  });
});
