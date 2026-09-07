"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";
import { usePalette, roundRect, type Palette } from "@/lib/canvas-theme";

/* Neon Racer — Canvas 2D with a fake-perspective road.
   Same gameplay (dodge blocks, distance score), zero WebGL. */

const LANES = 2.6; // half-width of the road in world units
const CAR_SPEED = 0.055; // lateral units per frame step
const SPEED_START = 9;
const SPEED_MAX = 26;

type Obstacle = { z: number; x: number };

function project(z: number, x: number, w: number, h: number, horizon: number) {
  const scale = 1 / z;
  const y = horizon + (h - horizon) * scale;
  const cx = w / 2 + x * scale * (w * 0.42);
  const halfRoad = (w * 0.46) * scale;
  return { y, cx, halfRoad };
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  carX: number,
  obstacles: Obstacle[],
  distance: number,
  crashed: boolean,
  pal: Palette
) {
  const horizon = h * 0.32;
  ctx.clearRect(0, 0, w, h);

  // sky / ground
  ctx.fillStyle = pal.surface2;
  ctx.fillRect(0, 0, w, horizon);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, horizon, w, h - horizon);

  // distant hills (flat, two tones — no gradients)
  ctx.fillStyle = pal.surface;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  for (let i = 0; i <= 6; i++) {
    const x = (w / 6) * i;
    const peak = horizon - (i % 2 === 0 ? h * 0.07 : h * 0.04);
    ctx.lineTo(x + w / 12, peak);
    ctx.lineTo(x + w / 6, horizon);
  }
  ctx.closePath();
  ctx.fill();

  // road trapezoid
  const near = project(1, 0, w, h, horizon);
  const far = project(30, 0, w, h, horizon);
  ctx.fillStyle = pal.surface;
  ctx.beginPath();
  ctx.moveTo(near.cx - near.halfRoad, near.y);
  ctx.lineTo(near.cx + near.halfRoad, near.y);
  ctx.lineTo(far.cx + far.halfRoad, far.y);
  ctx.lineTo(far.cx - far.halfRoad, far.y);
  ctx.closePath();
  ctx.fill();

  // road edges
  ctx.strokeStyle = pal.brand;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(near.cx - near.halfRoad, near.y);
  ctx.lineTo(far.cx - far.halfRoad, far.y);
  ctx.moveTo(near.cx + near.halfRoad, near.y);
  ctx.lineTo(far.cx + far.halfRoad, far.y);
  ctx.stroke();

  // lane dashes
  ctx.fillStyle = pal.border;
  const dashStart = 1.2 - ((distance * 0.35) % 1);
  for (let d = dashStart; d < 30; d += 1.6) {
    const a = project(d, 0, w, h, horizon);
    const b = project(d + 0.7, 0, w, h, horizon);
    const width = Math.max(1, a.halfRoad * 0.035);
    ctx.fillRect(a.cx - width / 2, b.y, width, a.y - b.y);
  }
  // side lanes
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 1.5;
  [-0.62, 0.62].forEach((lx) => {
    const a = project(1.05, lx, w, h, horizon);
    const b = project(30, lx, w, h, horizon);
    ctx.beginPath();
    ctx.moveTo(a.cx, a.y);
    ctx.lineTo(b.cx, b.y);
    ctx.stroke();
  });

  // obstacles (drawn far → near)
  const sorted = [...obstacles].sort((a, b) => b.z - a.z);
  for (const o of sorted) {
    if (o.z < 1 || o.z > 30) continue;
    const p = project(o.z, o.x, w, h, horizon);
    const size = p.halfRoad * 0.3;
    ctx.fillStyle = pal.accent;
    roundRect(ctx, p.cx - size / 2, p.y - size, size, size, size * 0.2);
    ctx.fill();
    ctx.fillStyle = pal.brandDark;
    roundRect(ctx, p.cx - size / 2, p.y - size * 0.32, size, size * 0.32, size * 0.12);
    ctx.fill();
  }

  // car
  const car = project(1.06, carX, w, h, horizon);
  const cw = near.halfRoad * 0.34;
  const ch = cw * 1.7;
  ctx.fillStyle = crashed ? pal.danger : pal.brand;
  roundRect(ctx, car.cx - cw / 2, h - ch - h * 0.06, cw, ch, cw * 0.28);
  ctx.fill();
  // windscreen
  ctx.fillStyle = pal.surface2;
  roundRect(ctx, car.cx - cw * 0.32, h - ch - h * 0.06 + ch * 0.16, cw * 0.64, ch * 0.26, cw * 0.1);
  ctx.fill();
  // wheels
  ctx.fillStyle = pal.text;
  ctx.fillRect(car.cx - cw * 0.62, h - h * 0.06 - ch * 0.42, cw * 0.2, ch * 0.34);
  ctx.fillRect(car.cx + cw * 0.42, h - h * 0.06 - ch * 0.42, cw * 0.2, ch * 0.34);
}

export default function Racing({ onEnd }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pal = usePalette();
  const [score, setScore] = useState(0);
  const [crashed, setCrashed] = useState(false);

  const carX = useRef(0);
  const speed = useRef(SPEED_START);
  const distance = useRef(0);
  const obstacles = useRef<Obstacle[]>([
    { z: 8, x: -0.6 },
    { z: 14, x: 0.5 },
    { z: 20, x: -0.3 },
    { z: 26, x: 0.65 },
    { z: 32, x: 0 },
  ]);
  const keys = useRef<Set<string>>(new Set());
  const endedRef = useRef(false);
  const startedAt = useRef(Date.now());
  const scoreRef = useRef(0);
  const crashedRef = useRef(false);

  crashedRef.current = crashed;

  const randomX = () => (Math.random() - 0.5) * 2 * (LANES / 3);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let last = performance.now();
    let w = 360;
    let h = 480;

    const resize = () => {
      const box = canvas.parentElement?.getBoundingClientRect().width ?? 360;
      w = Math.max(260, Math.min(520, Math.floor(box)));
      h = Math.floor(w * 1.3);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const c = canvas.getContext("2d");
      if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!crashedRef.current) {
        // steering
        if (keys.current.has("ArrowLeft") || keys.current.has("a")) carX.current -= CAR_SPEED;
        if (keys.current.has("ArrowRight") || keys.current.has("d")) carX.current += CAR_SPEED;
        carX.current = Math.max(-LANES / 2.4, Math.min(LANES / 2.4, carX.current));

        // speed ramp + distance
        speed.current = Math.min(SPEED_MAX, SPEED_START + scoreRef.current / 40);
        distance.current += speed.current * dt;
        const next = Math.floor(distance.current);
        if (next !== scoreRef.current) {
          scoreRef.current = next;
          setScore(next);
        }

        // move obstacles
        for (const o of obstacles.current) {
          o.z -= speed.current * dt;
          if (o.z < 1) {
            o.z = 26 + Math.random() * 10;
            o.x = randomX();
          }
          if (o.z > 1.9 && o.z < 2.7 && Math.abs(o.x - carX.current) < 0.42) {
            crashedRef.current = true;
            setCrashed(true);
            sfx("lose");
            window.setTimeout(
              () =>
                onEnd({
                  score: scoreRef.current,
                  maxScore: 300,
                  accuracy: Math.min(1, scoreRef.current / 250),
                  timeMs: Date.now() - startedAt.current,
                }),
              800
            );
          }
        }
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        draw(ctx, w, h, carX.current, obstacles.current, distance.current, crashedRef.current, pal);
        if (crashedRef.current) {
          ctx.fillStyle = "rgba(21,23,27,0.5)";
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "#fff";
          ctx.font = "800 26px Nunito, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`Crash! ${scoreRef.current} m`, w / 2, h / 2);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [pal, onEnd]);

  const swipe = useRef<number | null>(null);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="chip">
          🏁 <span className="tnum">{score}</span> m
        </span>
        <span className="chip">
          ⚡ <span className="tnum">{Math.round(speed.current * 6)}</span> km/h
        </span>
      </div>
      <div
        className="mx-auto flex w-full touch-none justify-center"
        onTouchStart={(e) => (swipe.current = e.touches[0].clientX)}
        onTouchMove={(e) => {
          if (swipe.current === null || crashed) return;
          const dx = e.touches[0].clientX - swipe.current;
          if (Math.abs(dx) > 4) {
            carX.current = Math.max(-LANES / 2.4, Math.min(LANES / 2.4, carX.current + dx * 0.006));
            swipe.current = e.touches[0].clientX;
          }
        }}
        onTouchEnd={() => (swipe.current = null)}
      >
        <canvas
          ref={canvasRef}
          className="rounded-card border border-line"
          role="img"
          aria-label="Racing game: dodge the blocks"
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted">← → ya swipe se lane badlo — blocks se bacho!</p>
    </div>
  );
}
