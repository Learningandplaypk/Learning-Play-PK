"use client";

import React, { useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { generate, isSolved, isValidPlacement, type Level } from "@/lib/engines/sudoku";
import { sfx } from "@/lib/sfx";

const LEVELS: Level[] = ["easy", "medium", "hard"];
const MAX_SCORE: Record<Level, number> = { easy: 120, medium: 180, hard: 260 };
const PAR_MS: Record<Level, number> = { easy: 5 * 60000, medium: 10 * 60000, hard: 16 * 60000 };

export default function SudokuGame({ onEnd }: GameProps) {
  const [level, setLevel] = useState<Level | null>(null);
  const [puzzle, setPuzzle] = useState<ReturnType<typeof generate> | null>(null);
  const [grid, setGrid] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Record<number, number[]>>({});
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const startedRef = useRef(false);
  if (!startedRef.current && puzzle) {
    startedRef.current = true;
    setStartedAt(Date.now());
  }

  const start = (lv: Level) => {
    const p = generate(lv);
    setLevel(lv);
    setPuzzle(p);
    setGrid(p.puzzle.slice());
    setNotes({});
    setMistakes(0);
    setDone(false);
    setStartedAt(Date.now());
  };

  const place = (v: number) => {
    if (selected === null || puzzle === null || level === null || done) return;
    if (puzzle.puzzle[selected] !== 0) return; // given cell
    if (notesMode) {
      setNotes((n) => {
        const cur = n[selected] ?? [];
        return { ...n, [selected]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
      });
      return;
    }
    const next = grid.slice();
    next[selected] = v;
    if (v !== puzzle.solution[selected]) {
      sfx("wrong");
      setMistakes((m) => m + 1);
    } else sfx("correct");
    setGrid(next);
    if (isSolved(next, puzzle.solution)) {
      setDone(true);
      const time = Date.now() - startedAt;
      const speedBonus = Math.max(0, 1 - time / PAR_MS[level]);
      const score = Math.round(MAX_SCORE[level] * (0.55 + 0.45 * speedBonus) * Math.max(0.4, 1 - mistakes * 0.06));
      onEnd({ score, maxScore: MAX_SCORE[level], accuracy: 1, timeMs: time, flag: "sudoku-win" });
    }
  };

  const conflicts = useMemo(() => {
    const set = new Set<number>();
    if (!grid.length) return set;
    const check = (cells: number[]) => {
      const seen: Record<number, number[]> = {};
      cells.forEach((i) => {
        if (grid[i] === 0) return;
        (seen[grid[i]] ??= []).push(i);
      });
      Object.values(seen).forEach((group) => group.length > 1 && group.forEach((i) => set.add(i)));
    };
    for (let r = 0; r < 9; r++) check(Array.from({ length: 9 }, (_, c) => r * 9 + c));
    for (let c = 0; c < 9; c++) check(Array.from({ length: 9 }, (_, r) => r * 9 + c));
    for (let br = 0; br < 9; br += 3)
      for (let bc = 0; bc < 9; bc += 3) {
        const cells: number[] = [];
        for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) cells.push((br + dr) * 9 + bc + dc);
        check(cells);
      }
    return set;
  }, [grid]);

  if (!puzzle) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-5 text-muted">Mushkilat chuno:</p>
        <div className="grid gap-3">
          {LEVELS.map((lv, i) => (
            <button key={lv} onClick={() => start(lv)} className="glass glass-hover flex items-center justify-between px-6 py-4 text-left">
              <span className="font-display text-lg font-bold">{["🟢 Aasan", "🟡 Darmiyana", "🔴 Mushkil"][i]}</span>
              <span className="text-xs text-muted">{["38 clues", "30 clues", "24 clues"][i]}</span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted">Har puzzle unique hota hai — generator live mein banata hai.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md select-none">
      <div className="mb-3 flex justify-center gap-2 text-sm">
        <span className="chip">🟡 {level}</span>
        <span className="chip">❌ {mistakes}</span>
        <button className={`chip cursor-pointer ${notesMode ? "border-neon-green/50 text-neon-green" : ""}`} onClick={() => setNotesMode(!notesMode)}>
          ✏️ {notesMode ? "Notes ON" : "Notes OFF"}
        </button>
        <button
          className="chip cursor-pointer hover:text-ink"
          onClick={() => setGrid(puzzle.solution.slice())}
          aria-label="Reveal solution"
        >
          👁️ Hint (end)
        </button>
      </div>
      <div className="glass grid grid-cols-9 gap-0.5 p-1.5" role="grid" aria-label="Sudoku board">
        {grid.map((v, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const isGiven = puzzle.puzzle[i] !== 0;
          const conflict = conflicts.has(i);
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`grid aspect-square place-items-center text-sm font-bold transition sm:text-base ${
                c % 3 === 2 && c !== 8 ? "border-r border-white/25" : ""
              } ${r % 3 === 2 && r !== 8 ? "border-b border-white/25" : ""} ${
                selected === i ? "bg-electric/30" : ""
              } ${conflict ? "bg-pink-accent/25 text-pink-accent" : isGiven ? "text-ink" : "text-electric"}`}
              aria-label={`Cell ${r + 1},${c + 1}`}
            >
              {v !== 0 ? (
                v
              ) : notes[i]?.length ? (
                <span className="grid grid-cols-3 gap-px text-[7px] leading-none text-muted">
                  {Array.from({ length: 9 }, (_, n) => (
                    <span key={n}>{notes[i].includes(n + 1) ? n + 1 : ""}</span>
                  ))}
                </span>
              ) : (
                ""
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-9 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => place(n)} className="glass grid aspect-square place-items-center font-display font-black hover:!border-neon-green/60" aria-label={`Place ${n}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button className="chip cursor-pointer hover:text-ink" onClick={() => place(0)}>
          🧹 Cell clear karo
        </button>
      </div>
      {!isValidPlacement(grid) && <p className="mt-2 text-center text-xs text-pink-accent">Kuch cells mein conflict hai — red cells check karo.</p>}
    </div>
  );
}
