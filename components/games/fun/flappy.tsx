"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const W = 360;
const H = 540;
const GRAVITY = 0.45;
const FLAP = -7.6;
const PIPE_W = 62;
const GAP = 158;

type Pipe = { x: number; top: number; scored: boolean };

export default function Flappy({ onEnd }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const state = useRef({ y: H / 2, vel: 0, pipes: [] as Pipe[], frame: 0, score: 0 });
  const [score, setScore] = useState(0);
  const startedAt = useRef(Date.now());
  const deadRef = useRef(false);
  const rafRef = useRef(0);

  const reset = () => {
    state.current = { y: H / 2, vel: 0, pipes: [], frame: 0, score: 0 };
    setScore(0);
    setDead(false);
    deadRef.current = false;
    setStarted(true);
    startedAt.current = Date.now();
  };

  const flap = () => {
    if (deadRef.current) {
      reset();
      return;
    }
    if (!started) {
      setStarted(true);
      startedAt.current = Date.now();
    }
    state.current.vel = FLAP;
    sfx("click");
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = state.current;
      s.frame++;
      if (started && !deadRef.current) {
        s.vel += GRAVITY;
        s.y += s.vel;
        // spawn pipes
        if (s.frame % 95 === 0) {
          const top = 60 + Math.random() * (H - GAP - 160);
          s.pipes.push({ x: W + 20, top, scored: false });
        }
        s.pipes.forEach((p) => (p.x -= 2.6));
        s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 10);
        // collisions
        if (s.y > H - 34 || s.y < -20) {
          deadRef.current = true;
          setDead(true);
          sfx("lose");
          setTimeout(() => onEnd({ score: s.score, maxScore: 150, accuracy: Math.min(1, s.score / 100), timeMs: Date.now() - startedAt.current }), 400);
        }
        for (const p of s.pipes) {
          const inX = 60 + 14 > p.x && 60 - 14 < p.x + PIPE_W;
          if (inX && (s.y - 14 < p.top || s.y + 14 > p.top + GAP)) {
            deadRef.current = true;
            setDead(true);
            sfx("lose");
            setTimeout(() => onEnd({ score: s.score, maxScore: 150, accuracy: Math.min(1, s.score / 100), timeMs: Date.now() - startedAt.current }), 400);
            break;
          }
          if (!p.scored && p.x + PIPE_W < 60 - 14) {
            p.scored = true;
            s.score++;
            setScore(s.score);
            sfx("coin");
          }
        }
      }

      // ---- draw ----
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0b0d1c");
      bg.addColorStop(1, "#141838");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // stars
      ctx.fillStyle = "rgba(255,255,255,.35)";
      for (let i = 0; i < 30; i++) {
        const x = (i * 97 + ((s.frame * 0.3) % W)) % W;
        const y = (i * 173) % (H - 60);
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      // pipes neon
      for (const p of s.pipes) {
        const grd = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        grd.addColorStop(0, "#2d7cff");
        grd.addColorStop(1, "#b026ff");
        ctx.fillStyle = grd;
        ctx.shadowColor = "#2d7cff";
        ctx.shadowBlur = 16;
        ctx.fillRect(p.x, 0, PIPE_W, p.top);
        ctx.fillRect(p.x, p.top + GAP, PIPE_W, H - p.top - GAP - 30);
        ctx.shadowBlur = 0;
      }
      // ground
      ctx.fillStyle = "#05060f";
      ctx.fillRect(0, H - 30, W, 30);
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(0, H - 32, W, 2.5);
      // bird
      const bx = 60;
      const by = state.current.y;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.max(-0.5, Math.min(1, state.current.vel * 0.06)));
      ctx.shadowColor = "#39ff14";
      ctx.shadowBlur = 22;
      ctx.font = "28px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🐤", 0, 0);
      ctx.restore();
      // score
      ctx.font = "bold 40px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "rgba(244,246,255,.9)";
      ctx.textAlign = "center";
      ctx.fillText(String(s.score), W / 2, 70);

      if (deadRef.current) {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(0, 0, W, H);
        ctx.font = "bold 30px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "#ff2e97";
        ctx.fillText("Game Over", W / 2, H / 2 - 10);
        ctx.font = "15px sans-serif";
        ctx.fillStyle = "#f4f6ff";
        ctx.fillText("Tap karo dobara khelne ke liye", W / 2, H / 2 + 24);
      } else if (!started) {
        ctx.font = "bold 22px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "#39ff14";
        ctx.fillText("Tap / Space = Uchhalo!", W / 2, H / 2);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, onEnd]);

  return (
    <div className="mx-auto max-w-sm select-none">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={flap}
        onTouchStart={(e) => {
          e.preventDefault();
          flap();
        }}
        className="w-full rounded-3xl border border-white/10 shadow-[0_0_60px_-20px_rgba(45,124,255,.6)]"
        aria-label="Flappy game canvas"
      />
      <div className="mt-2 flex justify-center gap-2">
        <span className="chip">🎯 {score}</span>
        <span className="chip">🐦 Taps = flap</span>
      </div>
    </div>
  );
}
