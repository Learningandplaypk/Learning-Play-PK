"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { rng } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const SIZE = 9;
const WORDS = ["PAKISTAN", "CRICKET", "MANGO", "LAHORE", "SNAKE", "PAANI", "DOST", "KITAB", "SITARA", "ROBOT", "PAZZLE", "GAME"];

type Placement = { word: string; cells: number[] };

function generate(seed: number): { grid: string[][]; placements: Placement[] } {
  const rand = rng(seed);
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const placements: Placement[] = [];
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  const pool = [...WORDS].sort(() => rand() - 0.5).slice(0, 7);
  for (const word of pool) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const [dr, dc] = dirs[Math.floor(rand() * dirs.length)];
      const r0 = Math.floor(rand() * SIZE);
      const c0 = Math.floor(rand() * SIZE);
      const er = r0 + dr * (word.length - 1);
      const ec = c0 + dc * (word.length - 1);
      if (er < 0 || er >= SIZE || ec < 0 || ec >= SIZE) continue;
      const cells: number[] = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i;
        const c = c0 + dc * i;
        if (grid[r][c] && grid[r][c] !== word[i]) {
          ok = false;
          break;
        }
        cells.push(r * SIZE + c);
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[r0 + dr * i][c0 + dc * i] = word[i];
      placements.push({ word, cells });
      break;
    }
  }
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) grid[r][c] = alpha[Math.floor(rand() * 26)];
  return { grid, placements };
}

export default function WordSearch({ onEnd }: GameProps) {
  const [{ grid, placements }] = useState(() => generate(Math.floor(Math.random() * 1e9)));
  const [found, setFound] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [startedAt] = useState(() => Date.now());
  const dragging = useRef(false);

  useEffect(() => {
    const up = () => {
      if (selected.length >= 2) {
        const letters = selected.map((i) => grid[Math.floor(i / SIZE)][i % SIZE]).join("");
        const rev = letters.split("").reverse().join("");
        const hit = placements.find((p) => (p.word === letters || p.word === rev) && !found.includes(p.word));
        if (hit) {
          sfx("correct");
          const nf = [...found, hit.word];
          setFound(nf);
          if (nf.length === placements.length) {
            const elapsed = Date.now() - startedAt;
            const score = Math.max(30, 160 - Math.floor(elapsed / 1000));
            sfx("win");
            onEnd({ score, maxScore: 160, accuracy: 1, timeMs: elapsed });
          }
        } else if (selected.length) sfx("wrong");
      }
      setSelected([]);
      dragging.current = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, found]);

  const tap = (i: number) => {
    if (selected.includes(i)) return;
    sfx("click");
    setSelected((s) => [...s, i]);
  };

  const foundCells = useMemo(() => {
    const set = new Set<number>();
    placements.filter((p) => found.includes(p.word)).forEach((p) => p.cells.forEach((c) => set.add(c)));
    return set;
  }, [found, placements]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {placements.map((p) => (
          <span key={p.word} className={`chip ${found.includes(p.word) ? "border-neon-green/50 text-neon-green line-through" : ""}`}>
            {p.word}
          </span>
        ))}
      </div>
      <div
        className="glass grid touch-none select-none gap-1 p-2.5"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
      >
        {grid.flat().map((ch, i) => (
          <button
            key={i}
            onPointerDown={() => {
              dragging.current = true;
              tap(i);
            }}
            onPointerEnter={() => dragging.current && tap(i)}
            className={`grid aspect-square place-items-center rounded-lg font-display text-sm font-black sm:text-base ${
              foundCells.has(i)
                ? "bg-neon-green/25 text-neon-green"
                : selected.includes(i)
                  ? "bg-electric/40 text-white"
                  : "text-ink/80 hover:bg-white/10"
            }`}
          >
            {ch}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Mouse/finger se drag karo — words forward, neechay ya diagonal ho sakte hain ({found.length}/{placements.length})</p>
    </div>
  );
}
