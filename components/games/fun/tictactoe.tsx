"use client";

import React, { useMemo, useRef, useState } from "react";
import { Circle, X as XIcon } from "lucide-react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

type Cell = "X" | "O" | null;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winnerOf(b: Cell[]): { who: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line };
  }
  return null;
}

function minimax(b: Cell[], isAI: boolean): { score: number; move: number } {
  const w = winnerOf(b);
  if (w) return { score: w.who === "O" ? 10 : -10, move: -1 };
  if (b.every(Boolean)) return { score: 0, move: -1 };
  let best = { score: isAI ? -Infinity : Infinity, move: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = isAI ? "O" : "X";
    const res = minimax(b, !isAI);
    b[i] = null;
    const score = res.score - Math.sign(res.score) * 0.1; // prefer faster wins
    if (isAI ? score > best.score : score < best.score) best = { score, move: i };
  }
  return best;
}

/** Tic Tac Toe vs a perfect minimax AI — plain DOM grid, 44px+ targets. */
export default function TicTacToe({ onEnd }: GameProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const endedRef = useRef(false);
  const result = useMemo(() => winnerOf(board), [board]);
  const full = board.every(Boolean);

  const finish = (playerWon: boolean | null) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEnd({
      score: playerWon === true ? 100 : playerWon === false ? 30 : 60,
      maxScore: 100,
      accuracy: playerWon === true ? 1 : playerWon === null ? 0.6 : 0.3,
      timeMs: Date.now() - startedAt,
      flag: playerWon === true ? "ttt-win" : undefined,
    });
  };

  const pick = (i: number) => {
    if (board[i] || busy || result) return;
    sfx("click");
    const nb = board.slice();
    nb[i] = "X";
    setBoard(nb);
    const w1 = winnerOf(nb);
    if (w1 || nb.every(Boolean)) {
      if (w1) sfx("win");
      setTimeout(() => finish(w1 ? w1.who === "X" : null), 600);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const { move } = minimax(nb.slice(), true);
      if (move >= 0) nb[move] = "O";
      sfx("click");
      setBoard(nb);
      setBusy(false);
      const w2 = winnerOf(nb);
      if (w2 || nb.every(Boolean)) {
        if (w2 && w2.who === "O") sfx("lose");
        setTimeout(() => finish(w2 ? w2.who === "X" : null), 600);
      }
    }, 420);
  };

  const status = busy
    ? "AI soch raha hai…"
    : result
      ? result.who === "X"
        ? "Tum jeet gaye!"
        : "AI jeet gaya"
      : full
        ? "Barabari!"
        : "Tumhari chaal";

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <span className="chip">
          <XIcon size={13} strokeWidth={3} className="text-brand-ink" /> Tum (X)
        </span>
        <span className="chip">
          <Circle size={13} strokeWidth={3} className="text-accent-ink" /> AI (O)
        </span>
        <span className={`chip ${busy ? "chip-info" : result?.who === "X" ? "chip-brand" : ""}`}>{status}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-card border border-line bg-surface p-2">
        {board.map((cell, i) => {
          const inLine = result?.line.includes(i) ?? false;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={!!cell || busy || !!result}
              aria-label={cell ? `Cell ${i + 1}: ${cell}` : `Cell ${i + 1} khaali`}
              className={`flex aspect-square items-center justify-center rounded-xl border transition-colors ${
                inLine ? "border-brand bg-brand-tint" : "border-line bg-surface-2"
              } ${!cell && !busy && !result ? "hover:border-brand" : ""} disabled:cursor-default`}
            >
              {cell === "X" && <XIcon size={40} strokeWidth={3} className="text-brand-ink" />}
              {cell === "O" && <Circle size={34} strokeWidth={3} className="text-accent-ink" />}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-sm mt-3 w-full"
        onClick={() => finish(null)}
        disabled={endedRef.current}
      >
        Draw maan kar result dekho
      </button>
    </div>
  );
}
