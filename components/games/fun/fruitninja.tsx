"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const W = 400;
const H = 560;

type Fruit = { x: number; y: number; vx: number; vy: number; emoji: string; r: number; sliced: boolean; rot: number; vr: number; bomb: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type SliceLine = { x1: number; y1: number; x2: number; y2: number; life: number };

const FRUITS = ["🍎", "🍉", "🍊", "🥭", "🍌", "🍇", "🥝", "🍓"];

export default function FruitNinja({ onEnd }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fruits = useRef<Fruit[]>([]);
  const sparks = useRef<Spark[]>([]);
  const slices = useRef<SliceLine[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const prev = useRef<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const startedAt = useRef(Date.now());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const rafRef = useRef(0);
  scoreRef.current = score;
  livesRef.current = lives;

  const start = () => {
    fruits.current = [];
    sparks.current = [];
    setScore(0);
    setLives(3);
    setOver(false);
    setRunning(true);
    startedAt.current = Date.now();
  };

  const end = () => {
    setOver(true);
    setRunning(false);
    sfx("lose");
    setTimeout(() => onEnd({ score: scoreRef.current, maxScore: 200, accuracy: Math.min(1, scoreRef.current / 150), timeMs: Date.now() - startedAt.current }), 500);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const spawn = () => {
      const bomb = Math.random() < 0.14;
      const f: Fruit = {
        x: 40 + Math.random() * (W - 80),
        y: H + 30,
        vx: (Math.random() - 0.5) * 2.4,
        vy: -(9.5 + Math.random() * 3.4),
        emoji: bomb ? "💣" : FRUITS[Math.floor(Math.random() * FRUITS.length)],
        r: 26,
        sliced: false,
        rot: 0,
        vr: (Math.random() - 0.5) * 0.12,
        bomb,
      };
      fruits.current.push(f);
    };

    let spawnTimer = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0b0d1c");
      bg.addColorStop(1, "#101331");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      if (running && !over) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawn();
          spawnTimer = 700 + Math.random() * 700;
        }
      }

      // physics
      for (const f of fruits.current) {
        f.vy += 0.24 * (dt / 16.7);
        f.x += f.vx * (dt / 16.7);
        f.y += f.vy * (dt / 16.7);
        f.rot += f.vr;
      }
      // slice detection
      const p = pointer.current;
      if (p && prev.current && running && !over) {
        slices.current.push({ x1: prev.current.x, y1: prev.current.y, x2: p.x, y2: p.y, life: 220 });
        let hitThisSwipe = 0;
        for (const f of fruits.current) {
          if (f.sliced) continue;
          // distance from segment
          const dx = f.x - prev.current.x;
          const dy = f.y - prev.current.y;
          const sx = p.x - prev.current.x;
          const sy = p.y - prev.current.y;
          const len2 = sx * sx + sy * sy || 1;
          const t = Math.max(0, Math.min(1, (dx * sx + dy * sy) / len2));
          const cx = prev.current.x + sx * t;
          const cy = prev.current.y + sy * t;
          if ((f.x - cx) ** 2 + (f.y - cy) ** 2 < (f.r + 8) ** 2) {
            f.sliced = true;
            hitThisSwipe++;
            if (f.bomb) {
              setLives((l) => l - 1);
              sfx("lose");
              if (livesRef.current - 1 <= 0) end();
            } else {
              sfx("coin");
              for (let i = 0; i < 8; i++) {
                sparks.current.push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5 - 1, life: 500, color: "#39ff14" });
              }
            }
          }
        }
        if (hitThisSwipe >= 2) {
          setCombo((c) => c + hitThisSwipe);
          setScore((s) => s + hitThisSwipe * 2);
        }
      }
      prev.current = p ? { ...p } : null;

      fruits.current = fruits.current.filter((f) => {
        if (f.y > H + 60 && !f.sliced) {
          if (!f.bomb && running && !over) {
            setLives((l) => {
              const nl = l - 1;
              if (nl <= 0) end();
              return nl;
            });
            sfx("wrong");
          }
          return false;
        }
        return f.y < H + 80 && !f.sliced;
      });

      // draw fruits
      for (const f of fruits.current) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.font = `${f.r * 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = f.bomb ? "#ff2e97" : "#39ff14";
        ctx.shadowBlur = 14;
        ctx.fillText(f.emoji, 0, 0);
        ctx.restore();
      }

      // sparks
      sparks.current = sparks.current.filter((s) => (s.life -= dt) > 0);
      for (const s of sparks.current) {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.1;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life / 500;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // slice trail
      slices.current = slices.current.filter((s) => (s.life -= dt) > 0);
      for (const s of slices.current) {
        ctx.strokeStyle = `rgba(57,255,20,${s.life / 220})`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }

      // hearts
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("❤️".repeat(Math.max(0, livesRef.current)), 10, 24);
      ctx.font = "bold 22px 'Space Grotesk', sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#f4f6ff";
      ctx.fillText(String(scoreRef.current), W - 12, 28);

      if (!running && !over) {
        ctx.textAlign = "center";
        ctx.font = "bold 24px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "#39ff14";
        ctx.fillText("Tap = Start", W / 2, H / 2);
      }
      if (over) {
        ctx.fillStyle = "rgba(0,0,0,.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.font = "bold 28px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "#ff2e97";
        ctx.fillText("Khatam!", W / 2, H / 2 - 8);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, over]);

  const move = (x: number, y: number) => {
    pointer.current = { x, y };
  };

  return (
    <div className="mx-auto max-w-sm select-none">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full touch-none rounded-3xl border border-white/10"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          move(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
        }}
        onPointerLeave={() => (pointer.current = null)}
        onPointerDown={() => {
          if (!running) start();
        }}
        aria-label="Fruit Ninja canvas"
      />
      {combo >= 2 && <p className="mt-2 text-center font-display font-black text-neon-green">🔥 Combo x{combo}!</p>}
      <p className="mt-1 text-center text-xs text-muted">Swipe karke phal kaato 🍉 — bombs 💣 se bacho! 3 zindagi.</p>
    </div>
  );
}
