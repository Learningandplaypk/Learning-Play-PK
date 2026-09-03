"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const EMOJIS = ["🦉", "🐉", "🚀", "⚡", "🎮", "🧠", "🔥", "⭐", "🪙", "🎯"];

export default function MemoryGame({ onEnd }: GameProps) {
  const [grid, setGrid] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const lockRef = useRef(false);

  useEffect(() => {
    setGrid(shuffle([...EMOJIS, ...EMOJIS]));
    setStartedAt(Date.now());
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(iv);
  }, [startedAt]);

  const flip = (i: number) => {
    if (lockRef.current || flipped.includes(i) || matched.includes(i) || flipped.length >= 2) return;
    sfx("click");
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [a, b] = next;
      if (grid[a] === grid[b]) {
        setTimeout(() => {
          sfx("correct");
          setMatched((m) => {
            const nm = [...m, a, b];
            if (nm.length === grid.length) {
              const secs = Math.floor((Date.now() - startedAt) / 1000);
              const timeBonus = Math.max(0, 60 - secs) * 2;
              const moveEff = Math.max(0, 24 - (moves + 1)) * 5;
              const score = 40 + timeBonus + moveEff; // max: 40 + 120 + 120 = 280 → cap at 300 max
              onEnd({ score: Math.min(score, 300), maxScore: 300, accuracy: 1, timeMs: secs * 1000, flag: secs < 45 ? "memory-fast" : undefined });
            }
            return nm;
          });
          setFlipped([]);
          lockRef.current = false;
        }, 450);
      } else {
        setTimeout(() => {
          sfx("wrong");
          setFlipped([]);
          lockRef.current = false;
        }, 750);
      }
    }
  };

  const done = grid.length > 0 && matched.length === grid.length;
  void done;
  const pairsLeft = grid.length / 2 - matched.length / 2;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="chip">🧩 Pairs left: {pairsLeft}</span>
        <span className="chip">🖱️ Moves: {moves}</span>
        <span className="chip">⏱️ {elapsed}s</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {grid.map((e, i) => {
          const shown = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              onClick={() => flip(i)}
              className="flip-scene aspect-square"
              aria-label={`Card ${i + 1}${shown ? `: ${e}` : ""}`}
            >
              <div className={`flip-inner ${shown ? "flipped" : ""}`}>
                <div className="flip-face glass !rounded-2xl text-2xl">
                  <span className="text-neon-purple/70">✦</span>
                </div>
                <div
                  className={`flip-face flip-back !rounded-2xl text-4xl sm:text-5xl ${matched.includes(i) ? "bg-neon-green/15 border border-neon-green/40" : "glass"}`}
                  style={matched.includes(i) ? { borderRadius: "1rem" } : undefined}
                >
                  {e}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted">Sab pairs match karo — kam moves + tez time = zyada score!</p>
    </div>
  );
}
