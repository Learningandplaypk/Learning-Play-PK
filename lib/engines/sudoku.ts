/** Sudoku generator + validator — pure functions (unit-tested). */

export type Level = "easy" | "medium" | "hard";
const CLUES: Record<Level, number> = { easy: 38, medium: 30, hard: 24 };

export type Puzzle = {
  solution: number[]; // 81 cells, row-major, 0 = empty
  puzzle: number[];
  level: Level;
};

function ok(grid: number[], idx: number, val: number): boolean {
  const r = Math.floor(idx / 9);
  const c = idx % 9;
  for (let i = 0; i < 9; i++) {
    if (grid[r * 9 + i] === val) return false;
    if (grid[i * 9 + c] === val) return false;
  }
  const br = r - (r % 3);
  const bc = c - (c % 3);
  for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) if (grid[(br + dr) * 9 + bc + dc] === val) return false;
  return true;
}

function fill(grid: number[], rand: () => number): boolean {
  const idx = grid.indexOf(0);
  if (idx === -1) return true;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  for (const n of nums) {
    if (ok(grid, idx, n)) {
      grid[idx] = n;
      if (fill(grid, rand)) return true;
      grid[idx] = 0;
    }
  }
  return false;
}

/** Counts solutions up to `cap`. */
function countSolutions(grid: number[], cap = 2): number {
  const idx = grid.indexOf(0);
  if (idx === -1) return 1;
  let count = 0;
  for (let n = 1; n <= 9; n++) {
    if (ok(grid, idx, n)) {
      grid[idx] = n;
      count += countSolutions(grid, cap - count);
      grid[idx] = 0;
      if (count >= cap) break;
    }
  }
  return count;
}

export function generate(level: Level, rand: () => number = Math.random): Puzzle {
  const solution = Array(81).fill(0);
  fill(solution, rand);
  const puzzle = solution.slice();
  const targetClues = CLUES[level];
  const cells = Array.from({ length: 81 }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  let clues = 81;
  for (const cell of cells) {
    if (clues <= targetClues) break;
    const backup = puzzle[cell];
    puzzle[cell] = 0;
    const test = puzzle.slice();
    if (countSolutions(test, 2) !== 1) puzzle[cell] = backup;
    else clues--;
  }
  return { solution, puzzle, level };
}

/** Validates a (possibly partial) player grid: no conflicts. */
export function isValidPlacement(grid: number[]): boolean {
  for (let idx = 0; idx < 81; idx++) {
    const v = grid[idx];
    if (v === 0) continue;
    const test = grid.slice();
    test[idx] = 0;
    if (!ok(test, idx, v)) return false;
  }
  return true;
}

export function isSolved(grid: number[], solution: number[]): boolean {
  return grid.every((v, i) => v === solution[i]);
}
