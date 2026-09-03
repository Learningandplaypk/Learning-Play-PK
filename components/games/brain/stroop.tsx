"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const COLORS = [
  { name: "RED", ur: "LAL", hex: "#ff2e3f" },
  { name: "GREEN", ur: "SABZ", hex: "#39ff14" },
  { name: "BLUE", ur: "NEELA", hex: "#2d7cff" },
  { name: "YELLOW", ur: "PEELA", hex: "#ffd60a" },
  { name: "PURPLE", ur: "JAMNI", hex: "#b026ff" },
  { name: "ORANGE", ur: "NARANGI", hex: "#ff7a00" },
];

/** Stroop test: does the INK color match the WORD meaning? Tap ✓ / ✗. */
export default function StroopGame({ onEnd }: GameProps) {
  const TOTAL = 45;
  const [left, setLeft] = useState(TOTAL);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [q, setQ] = useState(() => genQ());
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const finishedRef = useRef(false);

  function genQ() {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    let ink = word;
    if (Math.random() < 0.55) {
      do {
        ink = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (ink.name === word.name);
    }
    return { word, ink, match: word.name === ink.name };
  }

  useEffect(() => {
    const iv = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(iv);
          if (!finishedRef.current) {
            finishedRef.current = true;
            const score = correct * 10 + Math.max(0, 30 - wrong) * 5;
            onEnd({ score, maxScore: 400, accuracy: correct + wrong ? correct / (correct + wrong) : 0, timeMs: TOTAL * 1000 });
          }
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correct, wrong]);

  const answer = (yes: boolean) => {
    const ok = yes === q.match;
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
      setFlash("ok");
    } else {
      sfx("wrong");
      setWrong((w) => w + 1);
      setStreak(0);
      setFlash("no");
    }
    setQ(genQ());
    setTimeout(() => setFlash(null), 180);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") answer(false);
      if (e.key === "ArrowRight") answer(true);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const acc = useMemo(() => (correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 100), [correct, wrong]);

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">⏱️ {left}s</span>
        <span className="chip">✅ {correct}</span>
        <span className="chip">🎯 {acc}%</span>
        <span className="chip border-neon-orange/40 text-neon-orange">🔥 {streak}</span>
      </div>
      <div className={`glass p-10 ${flash === "ok" ? "!border-neon-green/70" : flash === "no" ? "shake !border-pink-accent/70" : ""}`}>
        <p className="text-xs uppercase tracking-widest text-muted">Kya INK ka rang word ke matlab se match karta hai?</p>
        <div className="mt-6 font-display text-6xl font-black" style={{ color: q.ink.hex, textShadow: `0 0 30px ${q.ink.hex}88` }}>
          {q.word.name}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button onClick={() => answer(false)} className="btn btn-ghost !rounded-2xl py-5 text-lg">
          ✗ Nahi
        </button>
        <button onClick={() => answer(true)} className="btn btn-neon !rounded-2xl py-5 text-lg">
          ✓ Haan
        </button>
      </div>
      <p className="mt-4 text-xs text-muted">Keyboard: ← Nahi • → Haan</p>
    </div>
  );
}
