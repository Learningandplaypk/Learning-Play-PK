"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import type { QuizQ } from "@/lib/quiz-types";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

export type QuizEngineProps = GameProps & {
  questions: QuizQ[];
  count?: number;
  seconds?: number;
  zoneLabel: string;
};

/** Core quiz engine: timed MCQs, streak bonus, explanations, Urdu+English questions welcome. */
export default function QuizEngine({ questions, count = 10, seconds = 20, onEnd, zoneLabel }: QuizEngineProps) {
  const ROUND = Math.min(count, questions.length);
  const [pool] = useState(() => shuffle(questions).map((q) => ({ ...q, opts: shuffle(q.o.map((text, i) => ({ text, correct: i === q.a }))) })));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [startedAt] = useState(() => Date.now());
  const answeredRef = useRef(false);

  const q = pool[idx];

  useEffect(() => {
    setLeft(seconds);
    answeredRef.current = false;
    const iv = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(iv);
          if (!answeredRef.current) {
            answeredRef.current = true;
            sfx("wrong");
            advance(false);
          }
          return 0;
        }
        if (l <= 5) sfx("tick");
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const advance = (wasCorrect: boolean) => {
    const nc = correct + (wasCorrect ? 1 : 0);
    const nstreak = wasCorrect ? streak + 1 : 0;
    setCorrect(nc);
    setStreak(nstreak);
    setBestStreak((b) => Math.max(b, nstreak));
    // compute from this round's values (avoids stale bestStreak in the timeout below)
    const effectiveBest = Math.max(bestStreak, nstreak);
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= ROUND) {
        const base = nc * 10;
        const bonus = effectiveBest >= 3 ? 15 : 0;
        onEnd({
          score: base + bonus,
          maxScore: ROUND * 10 + 15,
          accuracy: nc / ROUND,
          timeMs: Date.now() - startedAt,
          quizCorrect: nc,
        });
      } else setIdx(idx + 1);
    }, 1600);
  };

  const choose = (i: number) => {
    if (picked !== null || answeredRef.current) return;
    answeredRef.current = true;
    setPicked(i);
    const ok = q.opts[i].correct;
    if (ok) sfx("correct");
    else sfx("wrong");
    advance(ok);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex flex-wrap justify-center gap-2 text-sm">
        <span className="chip">{zoneLabel}</span>
        <span className="chip">{idx + 1}/{ROUND}</span>
        <span className="chip">✅ {correct}</span>
        {streak >= 2 && <span className="chip border-neon-orange/50 text-neon-orange">🔥 {streak}x streak!</span>}
      </div>
      {/* timer bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(left / seconds) * 100}%`, background: left <= 5 ? "#ff2e3f" : "linear-gradient(90deg,#39ff14,#2d7cff)" }}
        />
      </div>

      <div className={`glass p-6 sm:p-8 ${picked !== null ? "" : ""}`}>
        <p className="font-display text-lg font-bold leading-relaxed sm:text-xl">{q.q}</p>
        <div className="mt-5 grid gap-2.5">
          {q.opts.map((o, i) => {
            const state = picked === null ? "idle" : o.correct ? "right" : picked === i ? "wrong" : "dim";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-[15px] font-semibold transition ${
                  state === "idle"
                    ? "glass glass-hover"
                    : state === "right"
                      ? "border-neon-green/70 bg-neon-green/15 shadow-[0_0_24px_-6px_rgba(57,255,20,.5)]"
                      : state === "wrong"
                        ? "shake border-pink-accent/70 bg-pink-accent/15"
                        : "opacity-35"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 font-display text-xs font-black">
                  {["A", "B", "C", "D"][i]}
                </span>
                {o.text}
              </button>
            );
          })}
        </div>
        {picked !== null && q.opts[picked] && (
          <div className="mt-4">
            <p className={`font-display text-sm font-black ${q.opts[picked].correct ? "text-neon-green" : "text-pink-accent"}`}>
              {q.opts[picked].correct ? "✅ Sahih jawab!" : `❌ Sahi jawab: ${q.opts.find((o) => o.correct)?.text}`}
            </p>
            {q.e && <p className="mt-1 text-sm text-muted">💡 {q.e}</p>}
          </div>
        )}
        {left === 0 && picked === null && <p className="mt-4 text-sm text-pink-accent">⏰ Waqt khatam! Sahi jawab: {q.opts.find((o) => o.correct)?.text}</p>}
      </div>
    </div>
  );
}
