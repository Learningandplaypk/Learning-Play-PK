"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const W = 380;
const H = 560;
const R = 17;
const COLORS = ["#39ff14", "#2d7cff", "#ff2e97", "#ff7a00", "#b026ff"];

type Bubble = { x: number; y: number; color: string; id: number };
type Flying = { x: number; y: number; vx: number; vy: number; color: string };

let idc = 1;

export default function BubbleShooter({ onEnd }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grid = useRef<Array<Bubble | null>>([]);
  const flying = useRef<Flying | null>(null);
  const aim = useRef(Math.PI / 2);
  const shooter = useRef({ color: COLORS[Math.floor(Math.random() * COLORS.length)] });
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const startedAt = useRef(Date.now());
  const rafRef = useRef(0);

  const COLS = 8;
  const ROWS = 12;

  const at = (r: number, c: number) => grid.current[r * COLS + c];
  const setAt = (r: number, c: number, v: Bubble | null) => (grid.current[r * COLS + c] = v);
  const px = (c: number, r: number) => c * (R * 2 + 2) + R + 4 + (r % 2 ? R : 0);
  const py = (r: number) => r * (R * 2 - 4) + R + 6;

  const initGrid = () => {
    grid.current = Array(COLS * ROWS).fill(null);
    for (let r = 0; r < 5; r++) {
      const count = r % 2 ? COLS - 1 : COLS;
      for (let c = 0; c < count; c++) {
        setAt(r, c, { x: px(c, r), y: py(r), color: COLORS[Math.floor(Math.random() * COLORS.length)], id: idc++ });
      }
    }
  };

  React.useEffect(() => {
    initGrid();
  }, []);

  const neighbors = (r: number, c: number): Array<[number, number]> => {
    const odd = r % 2;
    return [
      [r, c - 1], [r, c + 1],
      [r - 1, c + odd - 1 + 1 - 1], [r - 1, c + odd],
      [r + 1, c + odd - 1 + 1 - 1], [r + 1, c + odd],
    ].filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) as Array<[number, number]>;
  };

  const popCluster = (r: number, c: number) => {
    const color = at(r, c)!.color;
    const seen = new Set<number>();
    const stack: Array<[number, number]> = [[r, c]];
    const cluster: Array<[number, number]> = [];
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      const key = cr * COLS + cc;
      if (seen.has(key)) continue;
      seen.add(key);
      const b = at(cr, cc);
      if (!b || b.color !== color) continue;
      cluster.push([cr, cc]);
      for (const [nr, nc] of neighbors(cr, cc)) stack.push([nr, nc]);
    }
    if (cluster.length >= 3) {
      cluster.forEach(([cr, cc]) => setAt(cr, cc, null));
      sfx("correct");
      const gained = cluster.length * 5 + (cluster.length >= 5 ? 10 : 0);
      scoreRef.current += gained;
      setScore(scoreRef.current);
      // drop floating bubbles
      const anchored = new Set<number>();
      const stack2: Array<[number, number]> = [];
      for (let c = 0; c < COLS; c++) if (at(0, c)) stack2.push([0, c]);
      while (stack2.length) {
        const [cr, cc] = stack2.pop()!;
        const key = cr * COLS + cc;
        if (anchored.has(key) || !at(cr, cc)) continue;
        anchored.add(key);
        for (const [nr, nc] of neighbors(cr, cc)) stack2.push([nr, nc]);
      }
      let dropped = 0;
      for (let r2 = 0; r2 < ROWS; r2++)
        for (let c2 = 0; c2 < COLS; c2++) {
          if (at(r2, c2) && !anchored.has(r2 * COLS + c2)) {
            setAt(r2, c2, null);
            dropped++;
          }
        }
      if (dropped) {
        scoreRef.current += dropped * 3;
        setScore(scoreRef.current);
        sfx("win");
      }
      // win check
      if (!grid.current.some(Boolean)) {
        setOver(true);
        sfx("win");
        setTimeout(() => onEnd({ score: scoreRef.current + 50, maxScore: 200, accuracy: 1, timeMs: Date.now() - startedAt.current }), 500);
      }
    }
  };

  const land = (x: number, y: number, color: string) => {
    let bestR = 0, bestC = 0, bestD = Infinity;
    outer: for (let r = 0; r < ROWS; r++) {
      const count = r % 2 ? COLS - 1 : COLS;
      for (let c = 0; c < count; c++) {
        if (at(r, c)) continue;
        const bx = px(c, r);
        const by = py(r);
        if (by > H - 80) break outer;
        const d = (bx - x) ** 2 + (by - y) ** 2;
        if (d < bestD) {
          bestD = d;
          bestR = r;
          bestC = c;
        }
      }
    }
    setAt(bestR, bestC, { x: px(bestC, bestR), y: py(bestR), color, id: idc++ });
    popCluster(bestR, bestC);
    // lose if bubbles reach the bottom rows
    for (let c = 0; c < COLS; c++) {
      if (at(ROWS - 1, c)) {
        setOver(true);
        sfx("lose");
        setTimeout(() => onEnd({ score: scoreRef.current, maxScore: 200, accuracy: Math.min(1, scoreRef.current / 150), timeMs: Date.now() - startedAt.current }), 400);
        break;
      }
    }
  };

  const shoot = (mx: number, my: number) => {
    if (flying.current || over) return;
    const ox = W / 2;
    const oy = H - 46;
    const ang = Math.atan2(my - oy, mx - ox);
    const clamped = Math.max(-Math.PI + 0.3, Math.min(-0.3, ang < -Math.PI / 2 || ang > 0 ? -Math.PI / 2 : ang));
    aim.current = clamped;
    flying.current = { x: ox, y: oy, vx: Math.cos(clamped) * 9, vy: Math.sin(clamped) * 9, color: shooter.current.color };
    shooter.current = { color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    sfx("click");
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0b0d1c");
      bg.addColorStop(1, "#0f1230");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // grid bubbles
      for (const b of grid.current) {
        if (!b) continue;
        const grd = ctx.createRadialGradient(b.x - 5, b.y - 5, 2, b.x, b.y, R);
        grd.addColorStop(0, "#ffffff");
        grd.addColorStop(0.25, b.color);
        grd.addColorStop(1, b.color);
        ctx.fillStyle = grd;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // flying
      const f = flying.current;
      if (f) {
        f.x += f.vx;
        f.y += f.vy;
        if (f.x < R + 2 || f.x > W - R - 2) f.vx *= -1;
        if (f.y < R + 4) {
          flying.current = null;
          land(f.x, Math.max(R + 6, f.y), f.color);
        } else {
          let hit = false;
          for (const b of grid.current) {
            if (!b) continue;
            if ((b.x - f.x) ** 2 + (b.y - f.y) ** 2 < (R * 2 - 2) ** 2) {
              hit = true;
              break;
            }
          }
          if (hit) {
            flying.current = null;
            land(f.x, f.y - f.vy * 0.5, f.color);
          }
        }
        if (f) {
          const grd = ctx.createRadialGradient(f.x - 4, f.y - 4, 2, f.x, f.y, R);
          grd.addColorStop(0, "#fff");
          grd.addColorStop(0.3, f.color);
          grd.addColorStop(1, f.color);
          ctx.fillStyle = grd;
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(f.x, f.y, R, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // shooter
      const ox = W / 2;
      const oy = H - 46;
      ctx.strokeStyle = "rgba(57,255,20,.5)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(aim.current) * 60, oy + Math.sin(aim.current) * 60);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = shooter.current.color;
      ctx.shadowColor = shooter.current.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(ox, oy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // score + floor
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(0, H - 20, W, 2);
      ctx.font = "bold 20px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "#f4f6ff";
      ctx.textAlign = "right";
      ctx.fillText(String(scoreRef.current), W - 12, 26);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  return (
    <div className="mx-auto max-w-sm select-none">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full touch-none rounded-3xl border border-white/10"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          shoot(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 0) return;
          const r = e.currentTarget.getBoundingClientRect();
          const my = ((e.clientY - r.top) / r.height) * H;
          const mx = ((e.clientX - r.left) / r.width) * W;
          aim.current = Math.atan2(my - (H - 46), mx - W / 2);
        }}
        aria-label="Bubble shooter canvas"
      />
      {over && <p className="mt-2 text-center font-display text-lg font-black text-gradient">{score >= 100 ? "Shabash! 🏆" : "Game over"} — {score}</p>}
      <p className="mt-1 text-center text-xs text-muted">Tap karke goli chalao — 3+ same rang ke bubbles phato</p>
    </div>
  );
}
