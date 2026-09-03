"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { IDIOMS } from "@/data/english/idioms";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const TOTAL = 10;

export default function IdiomMaster({ onEnd }: GameProps) {
  const questions = useMemo(() => {
    const picked = shuffle(IDIOMS).slice(0, TOTAL);
    return picked.map((idiom) => {
      const wrongs = shuffle(IDIOMS.filter((x) => x.id !== idiom.id)).slice(0, 3).map((x) => x.meaning);
      const opts = shuffle([idiom.meaning, ...wrongs]);
      return { idiom, opts, answer: opts.indexOf(idiom.meaning) };
    });
  }, []);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const q = questions[idx];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    if (ok) sfx("correct");
    else sfx("wrong");
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= TOTAL) {
        onEnd({ score: (correct + (ok ? 1 : 0)) * 12, maxScore: TOTAL * 12, accuracy: (correct + (ok ? 1 : 0)) / TOTAL, timeMs: Date.now() - startedAt });
      } else setIdx(idx + 1);
    }, ok ? 1100 : 1800);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{TOTAL}</span>
        <span className="chip">✅ {correct}</span>
      </div>
      <div className="glass p-6 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-muted">Is idiom ka matlab kya hai?</p>
        <p className="mt-3 font-display text-2xl font-black text-gradient">“{q.idiom.id}”</p>
        <div className="mt-6 grid gap-2.5">
          {q.opts.map((o, i) => {
            const state = picked === null ? "idle" : i === q.answer ? "right" : picked === i ? "wrong" : "dim";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`rounded-xl border px-4 py-3 text-left text-[15px] font-semibold transition ${
                  state === "idle"
                    ? "glass glass-hover"
                    : state === "right"
                      ? "border-neon-green/70 bg-neon-green/15"
                      : state === "wrong"
                        ? "shake border-pink-accent/70 bg-pink-accent/15"
                        : "opacity-35"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-muted">
            📝 <span className="font-bold text-ink">{q.idiom.id}</span>: “{q.idiom.ex}”
          </p>
        )}
      </div>
    </div>
  );
}
