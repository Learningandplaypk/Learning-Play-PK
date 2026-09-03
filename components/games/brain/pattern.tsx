"use client";

import React, { useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

type Shape = "▲" | "●" | "■" | "★" | "◆";
const SHAPES: Shape[] = ["▲", "●", "■", "★", "◆"];
const SHAPE_COLORS = ["#39ff14", "#2d7cff", "#b026ff", "#ff2e97", "#ff7a00"];

type Round = { seq: Array<{ s: Shape; c: string }>; options: Array<{ s: Shape; c: string }>; answer: number };

function genRound(level: number): Round {
  const len = Math.min(3 + Math.floor(level / 3), 7);
  const seq = Array.from({ length: len }, (_, i) => ({ s: SHAPES[(i + level) % SHAPES.length], c: SHAPE_COLORS[(i + level) % SHAPE_COLORS.length] }));
  const nextIdx = (len + level) % SHAPES.length;
  const answer = { s: SHAPES[nextIdx], c: SHAPE_COLORS[nextIdx] };
  const distractors = shuffle(
    SHAPES.map((s, i) => ({ s, c: SHAPE_COLORS[i] })).filter((o) => o.s !== answer.s)
  ).slice(0, 2);
  const options = shuffle([answer, ...distractors]);
  return { seq, options, answer: options.findIndex((o) => o.s === answer.s) };
}

export default function PatternGame({ onEnd }: GameProps) {
  const TOTAL = 10;
  const [round, setRound] = useState(0);
  const [q, setQ] = useState<Round>(() => genRound(1));
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());

  const pick = (i: number) => {
    const ok = i === q.answer;
    setFeedback(i);
    if (ok) sfx("correct");
    else sfx("wrong");
    const nc = correct + (ok ? 1 : 0);
    setCorrect(nc);
    setTimeout(() => {
      setFeedback(null);
      const nr = round + 1;
      setRound(nr);
      if (nr >= TOTAL) {
        onEnd({ score: nc * 15, maxScore: TOTAL * 15, accuracy: nc / TOTAL, timeMs: Date.now() - startedAt });
      } else setQ(genRound(nr + 1));
    }, 420);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{round + 1}/{TOTAL}</span>
        <span className="chip">✅ {correct}</span>
      </div>
      <div className="glass p-8">
        <p className="text-xs uppercase tracking-widest text-muted">Pattern poora karo — agla shape kya hoga?</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {q.seq.map((it, i) => (
            <span key={i} className="grid h-14 w-14 place-items-center rounded-2xl bg-white/8 text-2xl font-black" style={{ color: it.c, textShadow: `0 0 16px ${it.c}99` }}>
              {it.s}
            </span>
          ))}
          <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-dashed border-neon-green/60 text-2xl text-neon-green animate-pulse-glow">?</span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {q.options.map((o, i) => (
          <button
            key={i}
            onClick={() => feedback === null && pick(i)}
            className={`glass grid h-20 place-items-center text-3xl font-black transition ${feedback === i ? (i === q.answer ? "!border-neon-green/80" : "shake !border-pink-accent/80") : "hover:!border-electric/60"}`}
            style={{ color: o.c, textShadow: `0 0 16px ${o.c}88` }}
            aria-label={`Option ${i + 1}`}
          >
            {o.s}
          </button>
        ))}
      </div>
    </div>
  );
}
