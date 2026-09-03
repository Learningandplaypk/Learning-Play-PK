"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const COLS = 10;
const ROWS = 18;

const SHAPES: Array<{ cells: number[][]; color: string }> = [
  { cells: [[1, 1, 1, 1]], color: "#2d7cff" }, // I
  { cells: [[1, 1], [1, 1]], color: "#ffd60a" }, // O
  { cells: [[0, 1, 0], [1, 1, 1]], color: "#b026ff" }, // T
  { cells: [[1, 0, 0], [1, 1, 1]], color: "#39ff14" }, // J
  { cells: [[0, 0, 1], [1, 1, 1]], color: "#ff7a00" }, // L
  { cells: [[0, 1, 1], [1, 1, 0]], color: "#ff2e97" }, // S
  { cells: [[1, 1, 0], [0, 1, 1]], color: "#00e5ff" }, // Z
];

type Piece = { cells: number[][]; color: string; x: number; y: number };

function rotate(cells: number[][]): number[][] {
  const rows = cells.length;
  const cols = cells[0].length;
  const out = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = cells[r][c];
  return out;
}

function randomPiece(): Piece {
  const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { cells: s.cells, color: s.color, x: Math.floor((COLS - s.cells[0].length) / 2), y: 0 };
}

export default function Tetris({ onEnd }: GameProps) {
  const boardRef = useRef<(string | null)[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
  const pieceRef = useRef<Piece>(randomPiece());
  const [, setTick] = useState(0);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [over, setOver] = useState(false);
  const overRef = useRef(false);
  const startedAt = useRef(Date.now());
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const collides = useCallback((p: Piece, nx: number, ny: number, cells = p.cells) => {
    for (let r = 0; r < cells.length; r++)
      for (let c = 0; c < cells[r].length; c++) {
        if (!cells[r][c]) continue;
        const x = nx + c;
        const y = ny + r;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && boardRef.current[y][x]) return true;
      }
    return false;
  }, []);

  const lock = useCallback(() => {
    const p = pieceRef.current;
    p.cells.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v && p.y + r >= 0) boardRef.current[p.y + r][p.x + c] = p.color;
      })
    );
    // clear lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (boardRef.current[r].every((v) => v)) {
        boardRef.current.splice(r, 1);
        boardRef.current.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      sfx("correct");
      setLines((l) => l + cleared);
      setScore((s) => s + [0, 40, 100, 300, 1200][cleared] * level);
    } else sfx("tick");
    const next = randomPiece();
    pieceRef.current = next;
    if (collides(next, next.x, next.y)) {
      setOver(true);
      overRef.current = true;
      sfx("lose");
      setTimeout(() => onEnd({ score: scoreRef.current, maxScore: 1000, accuracy: Math.min(1, scoreRef.current / 800), timeMs: Date.now() - startedAt.current }), 500);
    }
  }, [level, collides, onEnd]);

  const step = useCallback(() => {
    if (overRef.current) return;
    const p = pieceRef.current;
    if (!collides(p, p.x, p.y + 1)) {
      p.y += 1;
    } else {
      lock();
    }
    setTick((t) => t + 1);
  }, [collides, lock]);

  useEffect(() => {
    const speed = Math.max(120, 620 - level * 55);
    const iv = setInterval(step, speed);
    return () => clearInterval(iv);
  }, [step, level]);

  useEffect(() => {
    if (lines > 0 && lines >= level * 4) setLevel((l) => Math.min(10, l + 1));
  }, [lines, level]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (overRef.current) return;
      const p = pieceRef.current;
      if (e.key === "ArrowLeft" && !collides(p, p.x - 1, p.y)) { p.x -= 1; sfx("click"); }
      else if (e.key === "ArrowRight" && !collides(p, p.x + 1, p.y)) { p.x += 1; sfx("click"); }
      else if (e.key === "ArrowDown") step();
      else if (e.key === "ArrowUp") {
        const rot = rotate(p.cells);
        if (!collides(p, p.x, p.y, rot)) { p.cells = rot; sfx("whoosh"); }
        else if (!collides(p, p.x - 1, p.y, rot)) { p.cells = rot; p.x -= 1; sfx("whoosh"); }
        else if (!collides(p, p.x + 1, p.y, rot)) { p.cells = rot; p.x += 1; sfx("whoosh"); }
      } else if (e.key === " ") {
        while (!collides(p, p.x, p.y + 1)) p.y += 1;
        lock();
      } else return;
      e.preventDefault();
      setTick((t) => t + 1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [collides, step, lock]);

  const touch = useRef<{ x: number; y: number } | null>(null);

  // render composite board
  const view: (string | null)[][] = boardRef.current.map((row) => row.slice());
  pieceRef.current.cells.forEach((row, r) =>
    row.forEach((v, c) => {
      const y = pieceRef.current.y + r;
      const x = pieceRef.current.x + c;
      if (v && y >= 0 && y < ROWS && x >= 0 && x < COLS) view[y][x] = pieceRef.current.color;
    })
  );

  return (
    <div
      className="mx-auto flex max-w-md touch-none flex-col items-center select-none"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        const p = pieceRef.current;
        if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy)) {
          const nx = dx > 0 ? p.x + 1 : p.x - 1;
          if (!collides(p, nx, p.y)) { p.x = nx; sfx("click"); }
        } else if (dy > 40) {
          step();
        } else if (Math.abs(dy) < 12 && Math.abs(dx) < 12) {
          const rot = rotate(p.cells);
          if (!collides(p, p.x, p.y, rot)) { p.cells = rot; sfx("whoosh"); }
        }
        touch.current = null;
        setTick((t) => t + 1);
      }}
    >
      <div className="mb-3 flex justify-center gap-2 text-sm">
        <span className="chip">🎯 {score}</span>
        <span className="chip">📏 {lines} lines</span>
        <span className="chip">⚡ Lv {level}</span>
      </div>
      <div className="glass p-1.5">
        <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {view.flat().map((color, i) => (
            <div
              key={i}
              className="aspect-square w-[max(3.2vw,14px)] rounded-[3px]"
              style={{ background: color ?? "rgba(255,255,255,0.04)", boxShadow: color ? `0 0 10px ${color}66, inset 0 1px 2px rgba(255,255,255,.35)` : "none" }}
            />
          ))}
        </div>
      </div>
      {over && <p className="mt-3 font-display text-xl font-black text-gradient">Game Over — {score} points!</p>}
      <p className="mt-2 text-center text-[11px] text-muted">← → move • ↑ rotate • ↓ soft drop • Space hard drop • mobile: swipe</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:hidden">
        <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => { const p = pieceRef.current; if (!collides(p, p.x - 1, p.y)) p.x--; setTick((t) => t + 1); }} aria-label="Left">←</button>
        <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => { const p = pieceRef.current; const rot = rotate(p.cells); if (!collides(p, p.x, p.y, rot)) p.cells = rot; setTick((t) => t + 1); }} aria-label="Rotate">⟳</button>
        <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => { const p = pieceRef.current; if (!collides(p, p.x + 1, p.y)) p.x++; setTick((t) => t + 1); }} aria-label="Right">→</button>
        <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => step()} aria-label="Down">↓</button>
      </div>
    </div>
  );
}
