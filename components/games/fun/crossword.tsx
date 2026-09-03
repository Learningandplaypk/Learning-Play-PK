"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { rng } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const WORD_CLUES: Array<[string, string]> = [
  ["PAKISTAN", "Hamara pyara mulk 🇵🇰"],
  ["CRICKET", "Pakistan ka sab se mashhoor khel"],
  ["LAHORE", "Dilwalon ka shehar"],
  ["MANGO", "Faslon ka badshah 🥭"],
  ["CHAIR", "Us par baithte hain"],
  ["WATER", "Pani — English mein"],
  ["NIGHT", "Din ka ulta"],
  ["SUN", "Roshni dene wala taara"],
  ["BOOK", "Parhne wali cheez"],
  ["SMILE", "Khushi ki nishani 😊"],
  ["TIGER", "Jungle ka badshah"],
  ["MOON", "Raat mein chamakta hai"],
  ["RIVER", "Behta hua pani"],
  ["HOUSE", "Rehne ki jagah"],
  ["FRIEND", "Dost — English mein"],
  ["GREEN", "Jhanda ka rang 🟢"],
  ["HEART", "Dil — English mein"],
  ["SCHOOL", "Parhne ka idara"],
];

const SIZE = 10;

type Placed = { word: string; clue: string; row: number; col: number; horiz: boolean };

function generate(): { cells: Array<Array<{ ch: string; num: number | null } | null>>; placements: Placed[] } {
  const rand = rng(Math.floor(Math.random() * 1e9));
  const grid: Array<Array<{ ch: string; num: number | null } | null>> = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const placements: Placed[] = [];
  const pool = [...WORD_CLUES].sort(() => rand() - 0.5);

  const canPlace = (word: string, row: number, col: number, horiz: boolean): number | null => {
    // returns intersection count if placeable
    let inter = 0;
    for (let i = 0; i < word.length; i++) {
      const r = horiz ? row : row + i;
      const c = horiz ? col + i : col;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
      const cell = grid[r][c];
      if (cell) {
        if (cell.ch !== word[i]) return null;
        inter++;
      } else {
        // no touching parallel cells
        const around: Array<[number, number]> = horiz
          ? [[r - 1, c], [r + 1, c]]
          : [[r, c - 1], [r, c + 1]];
        for (const [ar, ac] of around) if (ar >= 0 && ar < SIZE && ac >= 0 && ac < SIZE && grid[ar][ac]) return null;
      }
    }
    // caps must be free
    const before = horiz ? [row, col - 1] : [row - 1, col];
    const after = horiz ? [row, col + word.length] : [row + word.length, col];
    const isFree = ([r, c]: number[]) => r < 0 || r >= SIZE || c < 0 || c >= SIZE || !grid[r][c];
    if (!isFree(before) || !isFree(after)) return null;
    return inter;
  };

  const place = (word: string, clue: string, row: number, col: number, horiz: boolean) => {
    for (let i = 0; i < word.length; i++) {
      const r = horiz ? row : row + i;
      const c = horiz ? col + i : col;
      grid[r][c] = { ch: word[i], num: null };
    }
    placements.push({ word, clue, row, col, horiz });
  };

  // first word across the middle
  const [first, firstClue] = pool[0];
  place(first, firstClue, Math.floor(SIZE / 2), 1, true);

  for (const [word, clue] of pool.slice(1, 7)) {
    let done = false;
    for (const p of placements) {
      if (done) break;
      if (p.horiz === false && word.length < 4) continue;
      for (let i = 0; i < word.length && !done; i++) {
        const ch = word[i];
        for (let r = 0; r < SIZE && !done; r++) {
          for (let c = 0; c < SIZE && !done; c++) {
            const cell = grid[r][c];
            if (!cell || cell.ch !== ch) continue;
            const horiz = !p.horiz;
            const row = horiz ? r : r - i;
            const col = horiz ? c - i : c;
            if ((horiz ? row : col) < 0) continue;
            if (canPlace(word, row, col, horiz) !== null && canPlace(word, row, col, horiz)! >= 1) {
              place(word, clue, row, col, horiz);
              done = true;
            }
          }
        }
      }
    }
  }

  // number the starts
  let n = 1;
  for (const p of placements) {
    grid[p.row][p.col]!.num = n++;
  }
  return { cells: grid, placements };
}

export default function Crossword({ onEnd }: GameProps) {
  const { cells, placements } = useMemo(generate, []);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const totalCells = placements.reduce((n, p) => n + p.word.length, 0);
  const filled = Object.values(entries).filter(Boolean).length;

  const check = () => {
    setChecked(true);
    let good = 0;
    for (const p of placements) {
      const word = p.word;
      const got = word
        .split("")
        .map((_, i) => entries[`${p.row + (p.horiz ? 0 : i)}-${p.col + (p.horiz ? i : 0)}`] ?? "")
        .join("");
      if (got.toLowerCase() === word.toLowerCase()) good += word.length;
    }
    if (good === totalCells) sfx("win");
    else sfx(good > totalCells / 2 ? "correct" : "wrong");
    setTimeout(() => {
      onEnd({ score: Math.round((good / totalCells) * 130), maxScore: 130, accuracy: good / totalCells, timeMs: Date.now() - startedAt });
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="glass p-3">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {cells.flat().map((cell, i) => {
            if (!cell) return <div key={i} className="aspect-square rounded-[3px] bg-transparent" />;
            const key = `${Math.floor(i / SIZE)}-${i % SIZE}`;
            const isWrong = checked && entries[key] && entries[key].toLowerCase() !== cell.ch.toLowerCase();
            const isRight = checked && entries[key]?.toLowerCase() === cell.ch.toLowerCase();
            return (
              <div key={i} className="relative">
                {cell.num && <span className="pointer-events-none absolute left-0.5 top-0 z-10 text-[8px] font-bold text-electric">{cell.num}</span>}
                <input
                  maxLength={1}
                  value={entries[key] ?? ""}
                  onChange={(e) => setEntries((en) => ({ ...en, [key]: e.target.value.toUpperCase().slice(-1) }))}
                  className={`aspect-square w-full rounded-[3px] border border-white/10 bg-white/[0.06] text-center font-display text-sm font-black uppercase text-ink outline-none focus:border-neon-green/70 ${
                    isWrong ? "!bg-pink-accent/25 text-pink-accent" : isRight ? "!bg-neon-green/20 text-neon-green" : ""
                  }`}
                  aria-label={`Cell ${key}`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="glass mt-4 space-y-2 p-4 text-sm">
        {placements.map((p, i) => (
          <div key={i}>
            <span className="font-black text-electric">{cells[p.row][p.col]!.num}</span>
            <span className="text-muted"> ({p.horiz ? "→" : "↓"}) </span>
            {p.clue}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted">Bhari hui: {filled}/{totalCells}</span>
        <button className="btn btn-neon btn-sm" onClick={check} disabled={filled === 0}>
          ✔ Check karo
        </button>
      </div>
    </div>
  );
}
