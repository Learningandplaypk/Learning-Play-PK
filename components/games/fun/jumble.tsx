"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { ENGLISH_WORDS } from "@/data/english";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const ROUNDS = 8;

export default function Jumble({ onEnd }: GameProps) {
  const rounds = useMemo(
    () =>
      shuffle(ENGLISH_WORDS.filter((w) => w.en.length >= 4 && w.en.length <= 7))
        .slice(0, ROUNDS)
        .map((w) => ({ word: w.en, ur: w.ur, scrambled: shuffle(w.en.split("")).join("") })),
    []
  );
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [correct, setCorrect] = useState(0);
  const [state, setState] = useState<"typing" | "ok" | "no">("typing");
  const [showHint, setShowHint] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const round = rounds[idx];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || state !== "typing") return;
    const ok = guess.trim().toLowerCase() === round.word.toLowerCase();
    setState(ok ? "ok" : "no");
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
    } else sfx("wrong");
    setTimeout(() => {
      setState("typing");
      setGuess("");
      setShowHint(false);
      if (idx + 1 >= ROUNDS) {
        onEnd({ score: correct * 10 + (ok ? 10 : 0), maxScore: ROUNDS * 10, accuracy: (correct + (ok ? 1 : 0)) / ROUNDS, timeMs: Date.now() - startedAt });
      } else setIdx(idx + 1);
    }, ok ? 800 : 1300);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{ROUNDS}</span>
        <span className="chip">✅ {correct}</span>
      </div>
      <div className={`glass p-8 ${state === "no" ? "shake" : ""}`}>
        <p className="text-xs uppercase tracking-widest text-muted">Jumbled word theek karo</p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {round.scrambled.split("").map((ch, i) => (
            <span key={i} className="grid h-12 w-10 place-items-center rounded-xl bg-gradient-to-b from-electric/30 to-neon-purple/25 font-display text-xl font-black">
              {ch.toUpperCase()}
            </span>
          ))}
        </div>
        {showHint && <p className="urdu mt-3 text-lg text-neon-green">💡 {round.ur}</p>}
        <form onSubmit={submit} className="mt-5 flex gap-2">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Apna jawab likho…"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center font-display text-lg font-bold uppercase tracking-widest outline-none focus:border-neon-green/60"
            aria-label="Answer"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn btn-neon" type="submit">
            ↵
          </button>
        </form>
        <div className="mt-4 flex justify-center gap-2">
          <button className="chip cursor-pointer hover:text-ink" onClick={() => setShowHint(true)}>
            💡 Hint (- Urdu meaning)
          </button>
        </div>
        {state === "ok" && <p className="mt-3 font-bold text-neon-green">✅ Sahi!</p>}
        {state === "no" && <p className="mt-3 text-sm text-pink-accent">❌ Ghalat — yeh tha: <b>{round.word.toUpperCase()}</b></p>}
      </div>
    </div>
  );
}
