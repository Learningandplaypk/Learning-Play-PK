"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { LessonEmpty, LessonLoading, useLangPack, useLessonScript } from "./lesson-bits";
import { sfx } from "@/lib/sfx";

const TOTAL = 10;

export default function IdiomMaster({ lang = "english", onEnd }: GameProps) {
  const pack = useLangPack(lang);
  const { rtl, family } = useLessonScript(lang);
  const questions = useMemo(() => {
    if (!pack) return null;
    // English pack keeps its historical shape; other packs ship {i, m, ur, ex}
    const pool = pack.idioms.map((x) => ({ id: x.i, meaning: x.m, ex: x.ex, roman: x.r }));
    const picked = shuffle(pool).slice(0, TOTAL);
    return picked.map((idiom) => {
      const wrongs = shuffle(pool.filter((x) => x.id !== idiom.id)).slice(0, 3).map((x) => x.meaning);
      const opts = shuffle([idiom.meaning, ...wrongs]);
      return { idiom, opts, answer: opts.indexOf(idiom.meaning) };
    });
  }, [pack]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const q = questions?.[idx] ?? {
    idiom: { id: "", meaning: "", ex: "", roman: "" },
    opts: [] as string[],
    answer: -1,
  };

  const choose = (i: number) => {
    if (picked !== null || !questions) return;
    setPicked(i);
    const ok = i === q.answer;
    if (ok) sfx("correct");
    else sfx("wrong");
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= (questions?.length ?? TOTAL)) {
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
      <div className="card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-muted">Is idiom ka matlab kya hai?</p>
        <p
          className="mt-3 font-display text-2xl font-black"
          dir={rtl ? "rtl" : "ltr"}
          style={family ? { fontFamily: family } : undefined}
        >
          “{q.idiom.id}”
        </p>
        {q.idiom.roman && <p className="mt-1 text-xs text-muted">{q.idiom.roman}</p>}
        <div className="mt-6 grid gap-2.5">
          {q.opts.map((o, i) => {
            const state = picked === null ? "idle" : i === q.answer ? "right" : picked === i ? "wrong" : "dim";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`rounded-xl border px-4 py-3 text-start text-[15px] font-semibold transition ${
                  state === "idle"? "card": state === "right"? "border-brand/70 bg-brand/15": state === "wrong"? "shake border-accent/70 bg-accent/15": "opacity-35"}`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-muted">
            📝 <span className="font-bold text-fg">{q.idiom.id}</span>: “{q.idiom.ex}”
          </p>
        )}
      </div>
    </div>
  );
}
