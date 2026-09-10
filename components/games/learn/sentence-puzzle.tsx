"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { LessonEmpty, LessonLoading, useLangPack, useLessonScript } from "./lesson-bits";
import { sfx } from "@/lib/sfx";

const ROUNDS = 8;

type Round = { tokens: string[]; ur: string };

export default function SentencePuzzle({ lang = "english", onEnd }: GameProps) {
  const pack = useLangPack(lang);
  const { rtl, family } = useLessonScript(lang);
  const rounds = useMemo<Round[] | null>(() => {
    if (!pack) return null;
    // dedicated jumbled-sentence set first, phrases as a fallback pool
    const fromSentences = pack.sentences
      .filter((s) => s.s.split(/\s+/).length <= 10)
      .map((s) => ({ tokens: s.s.split(/\s+/), ur: `${s.ur} (${s.en})` }));
    const fromPhrases = pack.phrases
      .filter((p) => p.p.split(/\s+/).length >= 3 && p.p.split(/\s+/).length <= 10)
      .map((p) => ({ tokens: p.p.split(/\s+/), ur: `${p.ur} (${p.en})` }));
    const pool = fromSentences.length >= ROUNDS ? fromSentences : [...fromSentences, ...fromPhrases];
    return shuffle(pool).slice(0, ROUNDS);
  }, [pack]);

  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [startedAt] = useState(() => Date.now());

  if (!pack) return <LessonLoading />;
  if (!rounds || rounds.length === 0) return <LessonEmpty onEnd={onEnd} slug={lang} />;

  const round = rounds[idx];
  const tokens = useMemo(() => shuffle(round.tokens.map((t, i) => ({ t, i }))), [round]);

  const done = placed.length === round.tokens.length;

  const check = (usePlaced?: number[]) => {
    const cur = usePlaced ?? placed;
    const ok = cur.every((pi, slot) => tokens[pi].t === round.tokens[slot]);
    setChecked(ok);
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
    } else sfx("wrong");
    setTimeout(() => {
      setChecked(null);
      setPlaced([]);
      if (idx + 1 >= rounds.length) {
        onEnd({ score: (correct + (ok ? 1 : 0)) * 10, maxScore: rounds.length * 10, accuracy: (correct + (ok ? 1 : 0)) / rounds.length, timeMs: Date.now() - startedAt });
      } else setIdx(idx + 1);
    }, 1400);
  };

  const tapToken = (i: number) => {
    if (placed.includes(i) || done) return;
    sfx("click");
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === round.tokens.length) {
      setTimeout(() => check(next), 160);
    }
  };

  const undo = () => {
    sfx("click");
    setPlaced(placed.slice(0, -1));
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{rounds.length}</span>
        <span className="chip">✅ {correct}</span>
      </div>
      <div className={`card p-6 ${checked === false ? "shake" : ""}`}>
        <p className="text-xs uppercase tracking-widest text-muted">Jumla theek tarteeb mein lagao</p>
        <p className="urdu mt-2 text-xl text-brand-ink">{round.ur}</p>

        {/* answer area */}
        <div
          dir={rtl ? "rtl" : "ltr"}
          style={family ? { fontFamily: family } : undefined}
          className="mt-5 flex min-h-20 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line p-3"
        >
          {round.tokens.map((_, slot) => {
            const pi = placed[slot];
            return pi !== undefined ? (
              <button key={slot} onClick={() => { sfx("click"); setPlaced(placed.filter((_, s) => s !== slot)); }} className="rounded-lg bg-info/25 px-3 py-2 font-display text-sm font-bold">
                {tokens[pi].t}
              </button>
            ) : (
              <span key={slot} className="h-9 w-16 rounded-lg bg-surface-2" />
            );
          })}
        </div>

        {/* tokens */}
        <div dir={rtl ? "rtl" : "ltr"} style={family ? { fontFamily: family } : undefined} className="mt-5 flex flex-wrap justify-center gap-2">
          {tokens.map((tok, i) => (
            <button
              key={i}
              onClick={() => tapToken(i)}
              disabled={placed.includes(i)}
              className={`rounded-xl px-3.5 py-2.5 font-display text-sm font-bold transition ${
                placed.includes(i) ? "scale-90 opacity-25" : "card text-fg"}`}
            >
              {tok.t}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button className="chip-btn hover:text-fg" onClick={undo}>
            ⌫ Undo
          </button>
          {done && checked === null && (
            <button className="btn btn-primary btn-sm" onClick={() => check()}>
              ✔ Check
            </button>
          )}
        </div>
        {checked === true && <p className="mt-3 font-bold text-brand-ink">✅ Bilkul sahi!</p>}
        {checked === false && <p className="mt-3 text-sm text-accent-ink">❌ Ghalat tarteeb — sahi: {round.tokens.join(" ")}</p>}
      </div>
    </div>
  );
}
