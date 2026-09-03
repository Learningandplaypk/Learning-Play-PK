import { describe, it, expect } from "vitest";
import { newGame, move, canMove, maxTile, spawn, emptyGrid, type Grid } from "@/lib/engines/g2048";

const G = (rows: number[][]): Grid => rows.flat();

describe("2048 engine", () => {
  it("newGame spawns exactly 2 tiles with values 2 or 4", () => {
    const g = newGame();
    const tiles = g.filter((v) => v !== 0);
    expect(tiles.length).toBe(2);
    for (const v of tiles) expect([2, 4]).toContain(v);
  });

  it("move returns null when nothing moves (wall)", () => {
    const g = G([
      [2, 4, 2, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(move(g, "left")).toBeNull();
  });

  it("merge [2,2,_,_] left → 4 and +4 score", () => {
    const res = move(
      G([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "left"
    )!;
    expect(res.gained).toBe(4);
    expect(res.grid[0]).toBe(4);
  });

  it("triple [2,2,2,_] merges only leftmost pair (no double-merge)", () => {
    const res = move(
      G([
        [2, 2, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "left"
    )!;
    expect(res.grid[0]).toBe(4);
    expect(res.grid[1]).toBe(2);
    expect(res.grid[2]).toBe(0);
  });

  it("directions work: right/up/down mirror the left behavior", () => {
    const right = move(
      G([
        [0, 0, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "right"
    )!;
    expect(right.grid[3]).toBe(4);

    const up = move(
      G([
        [0, 0, 0, 0],
        [0, 0, 0, 2],
        [0, 0, 0, 2],
        [0, 0, 0, 0],
      ]),
      "up"
    )!;
    expect(up.grid[3]).toBe(4); // row 0, col 3

    const down = move(
      G([
        [0, 0, 0, 2],
        [0, 0, 0, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "down"
    )!;
    expect(down.grid[15]).toBe(4);
  });

  it("canMove false on full unmergeable board, true otherwise", () => {
    const stuck = G([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(canMove(stuck)).toBe(false);
    expect(canMove(newGame())).toBe(true);
  });

  it("maxTile + spawn helpers", () => {
    expect(maxTile(G([[0, 2, 8, 4]]))).toBe(8);
    const e = emptyGrid();
    const s = spawn(e, () => 0.99); // high rand → value 4
    expect([2, 4]).toContain(s[15]); // 0.99 → col 3, row 3
    expect(s.filter((v) => v !== 0).length).toBe(1);
  });

  it("1024+1024 merge → 2048", () => {
    const res = move(
      G([
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      "left"
    )!;
    expect(maxTile(res.grid)).toBe(2048);
  });
});
