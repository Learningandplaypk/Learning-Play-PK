"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const ROUNDS = 5;

export default function ReactionGame({ onEnd }: GameProps) {
  const [state, setState] = useState<"idle" | "wait" | "go" | "done">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const begin = () => {
    setState("wait");
    const delay = 900 + Math.random() * 2600;
    timer.current = setTimeout(() => {
      goAt.current = performance.now();
      sfx("tick");
      setState("go");
    }, delay);
  };

  const tap = () => {
    if (state === "idle" || state === "done") return begin();
    if (state === "wait") {
      sfx("wrong");
      if (timer.current) clearTimeout(timer.current);
      setTimes((t) => [...t, 800]); // too early = max penalty
      finish([...times, 800]);
      return;
    }
    const ms = Math.round(performance.now() - goAt.current);
    sfx("correct");
    const next = [...times, ms];
    setTimes(next);
    finish(next);
  };

  const finish = (all: number[]) => {
    if (all.length >= ROUNDS) {
      const avg = all.reduce((a, b) => a + b, 0) / all.length;
      const best = Math.min(...all);
      const score = Math.max(0, Math.round((520 - avg) / 2)); // avg 40ms → 240, avg 1000 → 0
      setState("done");
      onEnd({ score, maxScore: 250, accuracy: 1, timeMs: all.length * 2500, flag: best < 220 ? "reaction-fast" : undefined });
    } else {
      setState("idle");
    }
  };

  const last = times[times.length - 1];
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">Round {Math.min(times.length + 1, ROUNDS)}/{ROUNDS}</span>
        {avg > 0 && <span className="chip">⚡ avg {avg}ms</span>}
        {last !== undefined && <span className="chip">last {last}ms</span>}
      </div>
      <button
        onClick={tap}
        disabled={state === "done"}
        className={`grid h-72 w-full place-items-center rounded-3xl border font-display text-2xl font-black transition-colors duration-200 select-none ${
          state === "go"
            ? "border-neon-green bg-neon-green/20 text-neon-green shadow-[0_0_60px_-10px_rgba(57,255,20,.7)]"
            : state === "wait"
              ? "border-pink-accent/60 bg-pink-accent/10 text-pink-accent"
              : "glass hover:border-electric/60"
        }`}
        aria-label={state === "go" ? "Tap now" : "Tap to begin"}
      >
        {state === "idle" && (times.length === 0 ? "👆 Tap shuru karne ke liye" : "👆 Phir se tap karo")}
        {state === "wait" && " intezar karo…"}
        {state === "go" && "TAP! 🟢"}
        {state === "done" && `Khatam! Avg ${avg}ms`}
      </button>
      <p className="mt-4 text-xs text-muted">Jab green ho jaye utni jaldi tap karo — bohot jaldi tap karna bhi penalty hai!</p>
    </div>
  );
}
