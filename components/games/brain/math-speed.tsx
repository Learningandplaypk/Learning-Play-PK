"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { Input } from "@/components/ui";
import { sfx } from "@/lib/sfx";

type Q = { a: number; op: "+" | "-" | "×" | "÷"; b: number; ans: number };

function gen(level: number): Q {
  const ops: Array<"+" | "-" | "×" | "÷"> = level < 3 ? ["+", "-"] : level < 6 ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const cap = 10 + level * 4;
  let a = Math.floor(Math.random() * cap) + 2;
  let b = Math.floor(Math.random() * cap) + 2;
  if (op === "-" && b > a) [a, b] = [b, a];
  if (op === "÷") {
    b = Math.floor(Math.random() * 9) + 2;
    a = b * (Math.floor(Math.random() * 12) + 2);
  }
  const ans = op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : a / b;
  return { a, op, b, ans };
}

export default function MathSpeed({ onEnd }: GameProps) {
  const TOTAL = 60;
  const [left, setLeft] = useState(TOTAL);
  const [level, setLevel] = useState(1);
  const [q, setQ] = useState<Q>(() => gen(1));
  const [val, setVal] = useState("");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const iv = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(iv);
          const score = correct * 10 + bestStreak * 5;
          onEnd({ score, maxScore: 600, accuracy: correct + wrong > 0 ? correct / (correct + wrong) : 0, timeMs: TOTAL * 1000 });
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correct, wrong, bestStreak]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val === "") return;
    if (Number(val) === q.ans) {
      sfx("correct");
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
      setFlash("ok");
      if ((correct + 1) % 5 === 0) setLevel((l) => Math.min(9, l + 1));
    } else {
      sfx("wrong");
      setWrong((w) => w + 1);
      setStreak(0);
      setFlash("no");
    }
    setVal("");
    setQ(gen(level));
    setTimeout(() => setFlash(null), 250);
  };

  const acc = useMemo(() => (correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 100), [correct, wrong]);

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">⏱️ {left}s</span>
        <span className="chip">✅ {correct}</span>
        <span className="chip">🎯 {acc}%</span>
        <span className="chip border-neon-orange/40 text-neon-orange">🔥 {streak}</span>
      </div>
      <div className={`glass p-8 transition-colors ${flash === "ok" ? "!border-neon-green/70" : flash === "no" ? "shake !border-pink-accent/70" : ""}`}>
        <div className="mb-2 text-xs uppercase tracking-widest text-muted">Level {level}</div>
        <div className="font-display text-5xl font-black tracking-wide">
          {q.a} <span className="text-electric">{q.op}</span> {q.b} = <span className="text-neon-green">?</span>
        </div>
        <form onSubmit={submit} className="mt-6 flex gap-2">
          <Input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9-]*"
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/[^\d-]/g, ""))}
            placeholder="Jawab likho…"
            aria-label="Answer"
          />
          <button className="btn btn-neon" type="submit">
            ↵
          </button>
        </form>
      </div>
      <p className="mt-4 text-xs text-muted">Har 5 sahi jawab par level up — mushkil sawalat zyada points dete hain!</p>
    </div>
  );
}
