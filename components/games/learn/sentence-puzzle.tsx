"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { SENTENCES } from "@/data/english/sentences";
import { getLanguage } from "@/lib/langs";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const ROUNDS = 8;

type Round = { tokens: string[]; ur: string };

export default function SentencePuzzle({ lang = "english", onEnd }: GameProps) {
  const rounds = useMemo<Round[]>(() => {
    if (lang === "english") {
      return shuffle(SENTENCES.filter((s) => s.correct.length <= 9))
        .slice(0, ROUNDS)
        .map((s) => ({ tokens: s.correct, ur: s.ur }));
    }
    const data = getLanguage(lang);
    return shuffle(data?.phrases ?? [])
      .slice(0, ROUNDS)
      .map((p) => ({ tokens: p.phrase.split(/\s+/), ur: `${p.ur} (${p.en})` }));
  }, [lang]);

  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [startedAt] = useState(() => Date.now());

  if (rounds.length === 0) {
    onEnd({ score: 0, maxScore: ROUNDS * 10, accuracy: 0, timeMs: 0 });
    return null;
  }

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
      <div className={`glass p-6 ${checked === false ? "shake" : ""}`}>
        <p className="text-xs uppercase tracking-widest text-muted">Jumla theek tarteeb mein lagao</p>
        <p className="urdu mt-2 text-xl text-neon-green">{round.ur}</p>

        {/* answer area */}
        <div className="mt-5 flex min-h-20 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/20 p-3">
          {round.tokens.map((_, slot) => {
            const pi = placed[slot];
            return pi !== undefined ? (
              <button key={slot} onClick={() => { sfx("click"); setPlaced(placed.filter((_, s) => s !== slot)); }} className="rounded-lg bg-electric/25 px-3 py-2 font-display text-sm font-bold">
                {tokens[pi].t}
              </button>
            ) : (
              <span key={slot} className="h-9 w-16 rounded-lg bg-white/5" />
            );
          })}
        </div>

        {/* tokens */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {tokens.map((tok, i) => (
            <button
              key={i}
              onClick={() => tapToken(i)}
              disabled={placed.includes(i)}
              className={`rounded-xl px-3.5 py-2.5 font-display text-sm font-bold transition ${
                placed.includes(i) ? "scale-90 opacity-25" : "glass glass-hover text-ink"
              }`}
            >
              {tok.t}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button className="chip cursor-pointer hover:text-ink" onClick={undo}>
            ⌫ Undo
          </button>
          {done && checked === null && (
            <button className="btn btn-neon btn-sm" onClick={() => check()}>
              ✔ Check
            </button>
          )}
        </div>
        {checked === true && <p className="mt-3 font-bold text-neon-green">✅ Bilkul sahi!</p>}
        {checked === false && <p className="mt-3 text-sm text-pink-accent">❌ Ghalat tarteeb — sahi: {round.tokens.join(" ")}</p>}
      </div>
    </div>
  );
}
