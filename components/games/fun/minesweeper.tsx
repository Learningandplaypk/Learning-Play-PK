"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { rng } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const SIZE = 9;
const MINES = 10;

type Cell = { mine: boolean; open: boolean; flag: boolean; n: number };

function build(seed: number): Cell[][] {
  const rand = rng(seed);
  const grid: Cell[][] = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => ({ mine: false, open: false, flag: false, n: 0 })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(rand() * SIZE);
    const c = Math.floor(rand() * SIZE);
    if (!grid[r][c].mine) {
      grid[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc].mine) n++;
        }
      grid[r][c].n = n;
    }
  return grid;
}

const NUM_COLORS = ["", "#2d7cff", "#39ff14", "#ff7a00", "#ff2e97", "#b026ff", "#00e5ff", "#f4f6ff", "#8b90b0"];

export default function Minesweeper({ onEnd }: GameProps) {
  const [{ grid: initial }] = useState(() => ({ grid: build(Math.floor(Math.random() * 1e9)) }));
  const [grid, setGrid] = useState<Cell[][]>(() => initial.map((row) => row.map((c) => ({ ...c }))));
  const [status, setStatus] = useState<"play" | "won" | "lost">("play");
  const [flags, setFlags] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const revealAll = (g: Cell[][]) => g.map((row) => row.map((c) => ({ ...c, open: c.open || c.mine })));

  const open = (r: number, c: number) => {
    if (status !== "play" || grid[r][c].open || grid[r][c].flag) return;
    const g = grid.map((row) => row.map((cell) => ({ ...cell })));
    if (g[r][c].mine) {
      sfx("lose");
      setStatus("lost");
      setGrid(revealAll(g));
      setTimeout(() => onEnd({ score: 10, maxScore: 140, accuracy: 0.1, timeMs: Date.now() - startedAt }), 700);
      return;
    }
    // flood fill
    const stack: Array<[number, number]> = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const cell = g[cr][cc];
      if (cell.open || cell.flag) continue;
      cell.open = true;
      if (cell.n === 0) {
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !g[nr][nc].mine && !g[nr][nc].open) stack.push([nr, nc]);
          }
      }
    }
    sfx("click");
    setGrid(g);
    const closed = g.flat().filter((cell) => !cell.open).length;
    if (closed === MINES) {
      sfx("win");
      setStatus("won");
      const elapsed = Date.now() - startedAt;
      const score = Math.max(50, 140 - Math.floor(elapsed / 1000));
      setTimeout(() => onEnd({ score, maxScore: 140, accuracy: 1, timeMs: elapsed }), 500);
    }
  };

  const flag = (r: number, c: number) => {
    if (status !== "play" || grid[r][c].open) return;
    sfx("whoosh");
    const g = grid.map((row) => row.map((cell) => ({ ...cell })));
    g[r][c].flag = !g[r][c].flag;
    setGrid(g);
    setFlags(g.flat().filter((cell) => cell.flag).length);
  };

  const flagsLeft = MINES - flags;
  const won = status === "won";
  void won;

  return (
    <div className="mx-auto max-w-md select-none">
      <div className="mb-3 flex justify-center gap-2 text-sm">
        <span className="chip">🚩 {flagsLeft}</span>
        <span className="chip">{status === "play" ? "⛏️ Khodo!" : status === "won" ? "🏆 Jeet!" : "💥 Boom"}</span>
      </div>
      <div className="glass grid gap-1 p-2" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {grid.flat().map((cell, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          return (
            <button
              key={i}
              onClick={() => open(r, c)}
              onContextMenu={(e) => {
                e.preventDefault();
                flag(r, c);
              }}
              onTouchStart={(e) => {
                const t = e.touches[0];
                const target = e.target as HTMLElement;
                const start = Date.now();
                const timer = setTimeout(() => {
                  flag(r, c);
                  target.style.transform = "";
                  void t;
                  void start;
                }, 420);
                const clear = () => {
                  clearTimeout(timer);
                  target.removeEventListener("touchend", clear);
                };
                target.addEventListener("touchend", clear);
              }}
              className={`grid aspect-square place-items-center rounded-md font-display text-sm font-black transition sm:text-base ${
                cell.open
                  ? cell.mine
                    ? "bg-pink-accent/30"
                    : "bg-white/[0.03]"
                  : "bg-white/10 hover:bg-white/15 active:scale-95"
              }`}
              style={{ color: cell.open && !cell.mine ? NUM_COLORS[cell.n] : undefined }}
              aria-label={`Cell ${r},${c}${cell.open ? (cell.mine ? " mine" : ` ${cell.n}`) : " hidden"}`}
            >
              {cell.open ? (cell.mine ? "💣" : cell.n > 0 ? cell.n : "") : cell.flag ? "🚩" : ""}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Tap = khodo • Right-click / long-press = 🚩 flag ({flagsLeft} bache)</p>
    </div>
  );
}
