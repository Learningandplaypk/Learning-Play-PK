"use client";

import React, { useEffect, useRef } from "react";

/** Animated auth background: floating gradient orbs + orbiting emoji glyphs on a cheap 2D canvas. */
export function AuthBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const glyphs = ["🦉", "🎮", "📚", "🧠", "❓", "🔥", "🪙", "⚡", "🌍", "🏆"].map((g, i) => ({
      g,
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      s: 26 + Math.random() * 26,
      ph: i,
    }));
    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);
    const loop = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const p of glyphs) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0.05 || p.x > 0.95) p.vx *= -1;
        if (p.y < 0.05 || p.y > 0.95) p.vy *= -1;
        ctx.save();
        ctx.translate(p.x * w, p.y * h + Math.sin(t / 900 + p.ph) * 14);
        ctx.globalAlpha = 0.13;
        ctx.font = `${p.s * devicePixelRatio}px serif`;
        ctx.fillText(p.g, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden>
      <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-electric/15 blur-[110px]" />
      <div className="absolute -right-24 bottom-1/4 h-96 w-96 rounded-full bg-neon-purple/15 blur-[110px]" />
      <canvas ref={ref} className="h-full w-full opacity-70" />
    </div>
  );
}
