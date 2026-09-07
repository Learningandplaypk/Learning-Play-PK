"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";
import { usePalette, roundRect, type Palette } from "@/lib/canvas-theme";

/* Snake — Canvas 2D. Same gameplay as before, no WebGL: runs at 60fps on a
   2GB Android and works with the light and dark theme. */

const SIZE = 13;
const TICK = 170;
type P = { x: number; y: number };

function draw(
  ctx: CanvasRenderingContext2D,
  size: number,
  snake: P[],
  prev: P[],
  food: P,
  t: number,
  pal: Palette
) {
  const cell = size / SIZE;
  ctx.clearRect(0, 0, size, size);

  // board
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? pal.surface2 : pal.surface;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  // grid
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

  const lerp = (a: number, b: number) => a + (b - a) * Math.min(1, Math.max(0, t));
  const pos = (i: number) => {
    const cur = snake[Math.min(i, snake.length - 1)];
    const old = prev[Math.min(i, prev.length - 1)] ?? cur;
    return {
      x: lerp(old.x, cur.x) * cell,
      y: lerp((SIZE - 1 - old.y), (SIZE - 1 - cur.y)) * cell,
    };
  };

  // food (saffron apple)
  const f = { x: food.x * cell + cell / 2, y: (SIZE - 1 - food.y) * cell + cell / 2 };
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.arc(f.x, f.y, cell * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.brandDark;
  ctx.fillRect(f.x - cell * 0.04, f.y - cell * 0.36, cell * 0.08, cell * 0.16);

  // body
  for (let i = snake.length - 1; i >= 1; i--) {
    const p = pos(i);
    const inset = cell * (0.12 + (i / Math.max(4, snake.length)) * 0.1);
    ctx.fillStyle = i % 2 === 0 ? pal.brand : pal.brandDark;
    roundRect(ctx, p.x + inset, p.y + inset, cell - inset * 2, cell - inset * 2, cell * 0.22);
    ctx.fill();
  }

  // head
  const h = pos(0);
  ctx.fillStyle = pal.brand;
  roundRect(ctx, h.x + cell * 0.06, h.y + cell * 0.06, cell * 0.88, cell * 0.88, cell * 0.26);
  ctx.fill();
  // eyes
  ctx.fillStyle = pal.surface;
  const eye = cell * 0.16;
  ctx.beginPath();
  ctx.arc(h.x + cell * 0.34, h.y + cell * 0.36, eye, 0, Math.PI * 2);
  ctx.arc(h.x + cell * 0.66, h.y + cell * 0.36, eye, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.text;
  ctx.beginPath();
  ctx.arc(h.x + cell * 0.34, h.y + cell * 0.38, eye * 0.5, 0, Math.PI * 2);
  ctx.arc(h.x + cell * 0.66, h.y + cell * 0.38, eye * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

export default function Snake({ onEnd }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pal = usePalette();
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dead, setDead] = useState(false);

  const snake = useRef<P[]>([
    { x: 6, y: 6 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
  ]);
  const prev = useRef<P[]>(snake.current.slice());
  const food = useRef<P>({ x: 9, y: 6 });
  const dir = useRef<P>({ x: 1, y: 0 });
  const nextDir = useRef<P>({ x: 1, y: 0 });
  const pausedRef = useRef(false);
  const deadRef = useRef(false);
  const startedAt = useRef(Date.now());
  const boardRef = useRef(360);
  const scoreRef = useRef(0);

  pausedRef.current = paused;
  deadRef.current = dead;

  const spawnFood = (s: P[]): P => {
    let f: P;
    do {
      f = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
    } while (s.some((p) => p.x === f.x && p.y === f.y));
    return f;
  };

  /* ------------------------------- controls ------------------------------ */
  useEffect(() => {
    const setDir = (nd: P) => {
      if (nd.x !== -dir.current.x || nd.y !== -dir.current.y) nextDir.current = nd;
    };
    const fn = (e: KeyboardEvent) => {
      const map: Record<string, P> = {
        ArrowUp: { x: 0, y: 1 },
        ArrowDown: { x: 0, y: -1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: 1 },
        s: { x: 0, y: -1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (nd) {
        e.preventDefault();
        setDir(nd);
      }
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ----------------------------- game + render --------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const resize = () => {
      const box = canvas.parentElement?.getBoundingClientRect().width ?? 360;
      const size = Math.max(240, Math.min(520, Math.floor(box)));
      boardRef.current = size;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      const c = canvas.getContext("2d");
      if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const step = () => {
      if (pausedRef.current || deadRef.current) return;
      dir.current = nextDir.current;
      const cur = snake.current;
      const head = { x: cur[0].x + dir.current.x, y: cur[0].y + dir.current.y };
      const hit =
        head.x < 0 ||
        head.y < 0 ||
        head.x >= SIZE ||
        head.y >= SIZE ||
        cur.some((p) => p.x === head.x && p.y === head.y);
      if (hit) {
        deadRef.current = true;
        setDead(true);
        const final = scoreRef.current;
        window.setTimeout(
          () =>
            onEnd({
              score: final,
              maxScore: 200,
              accuracy: Math.min(1, final / 100),
              timeMs: Date.now() - startedAt.current,
              flag: final >= 20 ? "snake-20" : undefined,
            }),
          500
        );
        return;
      }
      prev.current = cur.map((p) => ({ ...p }));
      const grew = head.x === food.current.x && head.y === food.current.y;
      if (grew) {
        sfx("coin");
        scoreRef.current += 1;
        setScore(scoreRef.current);
        food.current = spawnFood([head, ...cur]);
      } else {
        sfx("tick");
      }
      snake.current = [head, ...(grew ? cur : cur.slice(0, -1))];
    };

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current && !deadRef.current) {
        acc += dt;
        while (acc >= TICK) {
          acc -= TICK;
          step();
        }
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        draw(ctx, boardRef.current, snake.current, prev.current, food.current, acc / TICK, pal);
        if (deadRef.current) {
          ctx.fillStyle = "rgba(21,23,27,0.55)";
          ctx.fillRect(0, 0, boardRef.current, boardRef.current);
          ctx.fillStyle = "#fff";
          ctx.font = "800 26px Nunito, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Game Over!", boardRef.current / 2, boardRef.current / 2);
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

  const swipe = useRef<{ x: number; y: number } | null>(null);
  const press = (nd: P) => {
    if (nd.x !== -dir.current.x || nd.y !== -dir.current.y) nextDir.current = nd;
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="chip">
          <span aria-hidden>🐍</span> Score <span className="tnum">{score}</span>
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
        >
          {paused ? <Play size={15} strokeWidth={2.4} /> : <Pause size={15} strokeWidth={2.4} />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div
        className="mx-auto flex w-full touch-none justify-center"
        onTouchStart={(e) => (swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!swipe.current) return;
          const dx = e.changedTouches[0].clientX - swipe.current.x;
          const dy = e.changedTouches[0].clientY - swipe.current.y;
          if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
            const nd = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: -Math.sign(dy) };
            press(nd);
          }
          swipe.current = null;
        }}
      >
        <canvas
          ref={canvasRef}
          className="rounded-card border border-line"
          role="img"
          aria-label="Snake game board"
        />
      </div>

      {/* touch d-pad */}
      <div className="mx-auto mt-3 grid w-40 grid-cols-3 gap-1.5 sm:hidden">
        <span />
        <button type="button" className="btn btn-secondary !min-h-11 !p-0" onClick={() => press({ x: 0, y: 1 })} aria-label="Upar">
          ↑
        </button>
        <span />
        <button type="button" className="btn btn-secondary !min-h-11 !p-0" onClick={() => press({ x: -1, y: 0 })} aria-label="Bayen">
          ←
        </button>
        <button type="button" className="btn btn-secondary !min-h-11 !p-0" onClick={() => press({ x: 0, y: -1 })} aria-label="Neechay">
          ↓
        </button>
        <button type="button" className="btn btn-secondary !min-h-11 !p-0" onClick={() => press({ x: 1, y: 0 })} aria-label="Dayen">
          →
        </button>
      </div>
    </div>
  );
}
