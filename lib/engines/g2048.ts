/** Pure 2048 engine — testable, framework-free. Grid is 4x4, row-major. */

export type Grid = number[];
export type Dir = "up" | "down" | "left" | "right";

export function emptyGrid(size = 4): Grid {
  return Array(size * size).fill(0);
}

export function spawn(grid: Grid, rand: () => number = Math.random): Grid {
  const empties = grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (empties.length === 0) return grid;
  const idx = empties[Math.floor(rand() * empties.length)];
  const next = grid.slice();
  next[idx] = rand() < 0.9 ? 2 : 4;
  return next;
}

export function newGame(rand: () => number = Math.random): Grid {
  return spawn(spawn(emptyGrid(), rand), rand);
}

function slideRow(row: number[]): { row: number[]; gained: number; moved: boolean } {
  const tiles = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      out.push(tiles[i] * 2);
      gained += tiles[i] * 2;
      i++;
    } else out.push(tiles[i]);
  }
  while (out.length < row.length) out.push(0);
  const moved = out.some((v, i) => v !== row[i]);
  return { row: out, gained, moved };
}

function transpose(g: Grid, size = 4): Grid {
  const out = emptyGrid(size);
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) out[c * size + r] = g[r * size + c];
  return out;
}

function reverseRows(g: Grid, size = 4): Grid {
  const out = g.slice();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size / 2; c++) {
      const a = r * size + c;
      const b = r * size + (size - 1 - c);
      [out[a], out[b]] = [out[b], out[a]];
    }
  }
  return out;
}

/** Move tiles in a direction. Returns null if nothing moved. */
export function move(grid: Grid, dir: Dir, size = 4): { grid: Grid; gained: number } | null {
  let g = grid.slice();
  if (dir === "up" || dir === "down") g = transpose(g, size);
  if (dir === "right" || dir === "down") g = reverseRows(g, size);

  let gained = 0;
  let moved = false;
  const out: Grid = [];
  for (let r = 0; r < size; r++) {
    const res = slideRow(g.slice(r * size, r * size + size));
    gained += res.gained;
    moved = moved || res.moved;
    out.push(...res.row);
  }

  g = out;
  if (dir === "right" || dir === "down") g = reverseRows(g, size);
  if (dir === "up" || dir === "down") g = transpose(g, size);
  if (!moved) return null;
  return { grid: g, gained };
}

export function canMove(grid: Grid, size = 4): boolean {
  return (["up", "down", "left", "right"] as Dir[]).some((d) => move(grid, d, size) !== null);
}

export function maxTile(grid: Grid): number {
  return Math.max(...grid);
}
