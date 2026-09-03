"use client";

import React, { useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const COLS = 7;
const ROWS = 6;

type Cell = 0 | 1 | 2; // 0 empty, 1 player, 2 AI

function dropRow(b: Cell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (b[r][col] === 0) return r;
  return -1;
}

function checkWin(b: Cell[][], p: Cell): Array<[number, number]> | null {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      for (const [dr, dc] of dirs) {
        const line: Array<[number, number]> = [];
        for (let i = 0; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr][nc] !== p) break;
          line.push([nr, nc]);
        }
        if (line.length === 4) return line;
      }
  return null;
}

function scoreWindow(win: Cell[]): number {
  const ai = win.filter((c) => c === 2).length;
  const me = win.filter((c) => c === 1).length;
  const empty = win.filter((c) => c === 0).length;
  if (ai && me) return 0;
  if (ai === 3 && empty === 1) return 6;
  if (ai === 2 && empty === 2) return 2;
  if (me === 3 && empty === 1) return -8;
  if (me === 2 && empty === 2) return -2;
  return ai === 1 ? 1 : 0;
}

function evaluate(b: Cell[][]): number {
  let score = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS - 3; c++) score += scoreWindow([b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3]]);
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS - 3; r++) score += scoreWindow([b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c]]);
  for (let r = 0; r < ROWS - 3; r++)
    for (let c = 0; c < COLS - 3; c++) score += scoreWindow([b[r][c], b[r + 1][c + 1], b[r + 2][c + 2], b[r + 3][c + 3]]);
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c < COLS - 3; c++) score += scoreWindow([b[r][c], b[r - 1][c + 1], b[r - 2][c + 2], b[r - 3][c + 3]]);
  return score;
}

function bestCol(b: Cell[][], depth: number): number {
  let bestScore = -Infinity;
  let bestMove = 3;
  for (const col of [3, 2, 4, 1, 5, 0, 6]) {
    const r = dropRow(b, col);
    if (r < 0) continue;
    b[r][col] = 2;
    const score = minimax(b, depth - 1, -Infinity, Infinity, false);
    b[r][col] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestMove = col;
    }
  }
  return bestMove;
}

function minimax(b: Cell[][], depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (checkWin(b, 2)) return 10000 + depth;
  if (checkWin(b, 1)) return -10000 - depth;
  if (depth === 0 || b[0].every((c) => c !== 0)) return evaluate(b);
  if (maximizing) {
    let value = -Infinity;
    for (let col = 0; col < COLS; col++) {
      const r = dropRow(b, col);
      if (r < 0) continue;
      b[r][col] = 2;
      value = Math.max(value, minimax(b, depth - 1, alpha, beta, false));
      b[r][col] = 0;
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }
  let value = Infinity;
  for (let col = 0; col < COLS; col++) {
    const r = dropRow(b, col);
    if (r < 0) continue;
    b[r][col] = 1;
    value = Math.min(value, minimax(b, depth - 1, alpha, beta, true));
    b[r][col] = 0;
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return value;
}

export default function Connect4({ onEnd }: GameProps) {
  const [board, setBoard] = useState<Cell[][]>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]));
  const [busy, setBusy] = useState(false);
  const [winLine, setWinLine] = useState<Array<[number, number]> | null>(null);
  const [startedAt] = useState(() => Date.now());
  const endedRef = React.useRef(false);

  const finish = (playerWon: boolean | null) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const time = Date.now() - startedAt;
    onEnd({
      score: playerWon === true ? 120 : playerWon === false ? 40 : 70,
      maxScore: 120,
      accuracy: playerWon === true ? 1 : playerWon === null ? 0.6 : 0.35,
      timeMs: time,
    });
  };

  const resolve = (nb: Cell[][]) => {
    const w = checkWin(nb, 1);
    if (w) {
      setWinLine(w);
      sfx("win");
      setTimeout(() => finish(true), 900);
      return true;
    }
    return false;
  };

  const play = (col: number) => {
    if (busy || winLine || endedRef.current) return;
    const r = dropRow(board, col);
    if (r < 0) return;
    sfx("click");
    const nb = board.map((row) => row.slice()) as Cell[][];
    nb[r][col] = 1;
    setBoard(nb);
    if (resolve(nb)) return;
    if (nb[0].every((c) => c !== 0)) {
      setTimeout(() => finish(null), 400);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const col2 = bestCol(nb, 4);
      const r2 = dropRow(nb, col2);
      if (r2 >= 0) nb[r2][col2] = 2;
      sfx("click");
      setBoard(nb);
      setBusy(false);
      const w2 = checkWin(nb, 2);
      if (w2) {
        setWinLine(w2);
        sfx("lose");
        setTimeout(() => finish(false), 900);
      } else if (nb[0].every((c) => c !== 0)) setTimeout(() => finish(null), 400);
    }, 420);
  };

  return (
    <div className="mx-auto max-w-lg select-none">
      <div className="mb-3 flex justify-center gap-2 text-sm">
        <span className="chip">🔴 Tum</span>
        <span className="chip">🟡 AI</span>
        <span className={`chip ${busy ? "border-neon-purple/50 text-neon-purple" : ""}`}>{busy ? "AI soch raha…" : winLine ? (board[winLine[0][0]][winLine[0][1]] === 1 ? "🏆 Jeet!" : "AI jeeta") : "Apni chaal khelo"}</span>
      </div>
      <div className="glass p-2.5">
        {/* column buttons */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: COLS }, (_, c) => (
            <button key={`h${c}`} onClick={() => play(c)} disabled={busy || dropRow(board, c) < 0} className="rounded-lg bg-white/5 py-1 text-xs font-black text-muted transition hover:bg-electric/25 hover:text-white disabled:opacity-20" aria-label={`Column ${c + 1} mein daalo`}>
              ▼
            </button>
          ))}
        </div>
        <div className="mt-1.5 grid gap-1.5 rounded-2xl bg-[#12142a] p-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {board.flat().map((cell, i) => {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            const inWin = winLine?.some(([wr, wc]) => wr === r && wc === c);
            return (
              <button key={i} onClick={() => play(c)} className="grid aspect-square place-items-center" aria-label={`Row ${r + 1} Column ${c + 1}`}>
                <span
                  className={`grid h-full w-full place-items-center rounded-full text-xl transition-all ${cell ? "pop-in" : ""}`}
                  style={{
                    background: cell === 1 ? "radial-gradient(circle at 35% 35%, #ff7a8a, #e0243f)" : cell === 2 ? "radial-gradient(circle at 35% 35%, #ffe66d, #e6a800)" : "rgba(255,255,255,0.06)",
                    boxShadow: cell ? (inWin ? "0 0 20px 4px rgba(57,255,20,.9)" : "0 3px 8px rgba(0,0,0,.5), inset 0 -3px 6px rgba(0,0,0,.3)") : "inset 0 2px 6px rgba(0,0,0,.4)",
                  }}
                >
                  {cell === 1 ? "🔴" : cell === 2 ? "🟡" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button className="chip cursor-pointer hover:text-ink" onClick={() => finish(null)} disabled={endedRef.current}>
          🏳️ Draw result
        </button>
      </div>
    </div>
  );
}
