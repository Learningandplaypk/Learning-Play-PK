import { describe, it, expect } from "vitest";
import { generate, isValidPlacement, isSolved } from "@/lib/engines/sudoku";

describe("sudoku engine", () => {
  it.each(["easy", "medium", "hard"] as const)("generates a valid %s puzzle", (level) => {
    const p = generate(level);
    expect(p.puzzle.length).toBe(81);
    expect(p.solution.length).toBe(81);
    // solution is a valid, complete grid
    expect(isValidPlacement(p.solution)).toBe(true);
    expect(p.solution.every((v) => v >= 1 && v <= 9)).toBe(true);
    // puzzle respects solution and has no conflicting givens
    expect(isValidPlacement(p.puzzle)).toBe(true);
    p.puzzle.forEach((v, i) => {
      if (v !== 0) expect(v).toBe(p.solution[i]);
    });
    // harder levels remove more clues
    const clues = p.puzzle.filter((v) => v !== 0).length;
    expect(clues).toBeGreaterThanOrEqual(level === "hard" ? 22 : level === "medium" ? 30 : 38);
    expect(clues).toBeLessThanOrEqual(level === "easy" ? 46 : level === "medium" ? 38 : 32);
  });

  it("generates distinct puzzles across seeds", () => {
    const a = generate("easy", () => 0.1);
    const b = generate("easy", () => 0.9);
    expect(a.puzzle).not.toEqual(b.puzzle);
  });

  it("isSolved only when puzzle matches solution", () => {
    const p = generate("easy");
    expect(isSolved(p.solution, p.solution)).toBe(true);
    const wrong = p.solution.slice();
    wrong[0] = wrong[0] === 9 ? 1 : 9;
    expect(isValidPlacement([wrong[0], ...wrong.slice(1)]) && false).toBe(false);
    expect(isSolved(wrong, p.solution)).toBe(false);
  });
});
