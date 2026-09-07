"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { canMove, move as gridMove, newGame, spawn, type Dir } from "@/lib/engines/g2048";
import { sfx } from "@/lib/sfx";

const TILE_STYLES: Record<number, string> = {
  2: "bg-surface-2 text-fg",
  4: "bg-surface-2 text-fg",
  8: "bg-info/40 text-white",
  16: "bg-info/60 text-white",
  32: "bg-info/50 text-white",
  64: "bg-info/70 text-white",
  128: "bg-accent/60 text-white",
  256: "bg-accent/80 text-white",
  512: "bg-accent/70 text-black",
  1024: "bg-brand/70 text-black",
  2048: "bg-brand text-black ",
};

export default function Game2048({ onEnd }: GameProps) {
  const [grid, setGrid] = useState<number[]>(() => newGame());
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const gridRef = useRef(grid);
  const scoreRef = useRef(0);
  gridRef.current = grid;

  const doMove = useCallback(
    (dir: Dir) => {
      if (over) return;
      const res = gridMove(gridRef.current, dir);
      if (!res) return;
      sfx("tick");
      const next = spawn(res.grid);
      const ns = scoreRef.current + res.gained;
      scoreRef.current = ns;
      setScore(ns);
      setGrid(next);
      if (!canMove(next)) {
        setOver(true);
        const elapsed = Date.now() - startedAt;
        // scoring: reaching 2048 = 500, scaled by progress + score
        const best = Math.max(...next);
        const prog = Math.min(1, Math.log2(best) / 11); // 2048 = 2^11
        const finalScore = Math.round(200 * prog + Math.min(300, ns / 20));
        onEnd({ score: finalScore, maxScore: 500, accuracy: prog, timeMs: elapsed });
      }
    },
    [onEnd, over, startedAt]
  );

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [doMove]);

  // touch swipe
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 24 || Math.abs(dy) > 24) {
      if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
      else doMove(dy > 0 ? "down" : "up");
    }
    touch.current = null;
  };

  return (
    <div className="mx-auto max-w-md select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mb-4 flex items-center justify-between">
        <span className="chip">🎯 {score}</span>
        <span className="chip">2048 banao!</span>
        <button className="chip-btn hover:text-fg" onClick={() => over && onEnd({ score: Math.round(score / 40), maxScore: 500, accuracy: 0.4, timeMs: Date.now() - startedAt })}>
          {over ? "Result dekho →" : "Swipe ya arrows"}
        </button>
      </div>
      <div className="card grid aspect-square grid-cols-4 grid-rows-4 gap-2 p-2.5">
        {grid.map((v, i) => (
          <div
            key={i}
            className={`grid place-items-center rounded-xl font-display text-xl font-black transition-all duration-150 sm:text-2xl ${
              v === 0 ? "bg-surface-2" : TILE_STYLES[v] ?? "bg-brand text-black"} ${v !== 0 ? "pop-in" : ""}`}
          >
            {v !== 0 ? v : ""}
          </div>
        ))}
      </div>
      {over && <p className="mt-4 text-center font-display text-xl font-bold ">Game over — {score} points!</p>}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
        <div />
        <button className="btn btn-secondary" onClick={() => doMove("up")} aria-label="Up">↑</button>
        <div />
        <button className="btn btn-secondary" onClick={() => doMove("left")} aria-label="Left">←</button>
        <button className="btn btn-secondary" onClick={() => doMove("down")} aria-label="Down">↓</button>
        <button className="btn btn-secondary" onClick={() => doMove("right")} aria-label="Right">→</button>
      </div>
    </div>
  );
}
