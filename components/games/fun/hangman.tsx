"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { ENGLISH_WORDS } from "@/data/english";
import { getLanguage } from "@/lib/langs";
import { sfx } from "@/lib/sfx";

const MAX_WRONG = 6;
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

const STAGES = ["😀", "🙂", "😐", "😟", "😧", "😰", "💀"];

export default function Hangman({ lang = "english", onEnd }: GameProps) {
  const target = useMemo(() => {
    if (lang === "english") return ENGLISH_WORDS[Math.floor(Math.random() * ENGLISH_WORDS.length)];
    const data = getLanguage(lang);
    const pool = (data?.words ?? []).filter((w) => /^[a-zA-Z\s'-]+$/.test(w.roman) && w.roman.length >= 4);
    const w = pool[Math.floor(Math.random() * pool.length)] ?? { roman: "salaam", en: "peace", ur: "امن" };
    return { en: w.roman, ur: `${w.ur} (${w.en})` };
  }, [lang]);

  const [guessed, setGuessed] = useState<string[]>([]);
  const [startedAt] = useState(() => Date.now());
  const word = target.en.toLowerCase();
  const wrong = guessed.filter((g) => !word.includes(g));
  const won = word.split("").every((ch) => ch === " " || guessed.includes(ch));
  const lost = wrong.length >= MAX_WRONG;
  const finished = won || lost;

  const guess = (ch: string) => {
    if (guessed.includes(ch) || finished) return;
    const ng = [...guessed, ch];
    setGuessed(ng);
    if (word.includes(ch)) sfx("correct");
    else sfx("wrong");
    // resolve
    const nw = ng.filter((g) => !word.includes(g)).length;
    const nWon = word.split("").every((c) => c === " " || ng.includes(c));
    if (nWon || nw >= MAX_WRONG) {
      if (nWon) sfx("win");
      const nWrongTotal = nw;
      setTimeout(() => {
        onEnd({
          score: nWon ? Math.max(20, 80 - nWrongTotal * 10) : 5,
          maxScore: 80,
          accuracy: nWon ? 1 - nWrongTotal * 0.12 : 0.1,
          timeMs: Date.now() - startedAt,
        });
      }, 800);
    }
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) guess(e.key.toLowerCase());
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessed, finished]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="glass p-6">
        <div className="text-6xl">{STAGES[Math.min(wrong.length, 6)]}</div>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted">Hint: {target.ur}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-1.5">
          {word.split("").map((ch, i) => (
            <span
              key={i}
              className={`grid h-11 w-9 place-items-center border-b-2 font-display text-xl font-black uppercase ${
                guessed.includes(ch) ? "border-neon-green text-ink" : lost ? "border-pink-accent text-pink-accent" : "border-white/25"
              }`}
            >
              {guessed.includes(ch) || lost ? ch : ""}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Galat: {wrong.length}/{MAX_WRONG}</p>

        {finished ? (
          <div className="mt-5">
            <p className={`font-display text-2xl font-black ${won ? "text-neon-green" : "text-pink-accent"}`}>
              {won ? "🎉 Bacha liya!" : `💀 Woh tha: ${word}`}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-7 gap-1.5 sm:grid-cols-9">
            {LETTERS.map((l) => {
              const used = guessed.includes(l);
              const hit = used && word.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => guess(l)}
                  disabled={used}
                  className={`aspect-square rounded-lg font-display text-sm font-black uppercase transition sm:text-base ${
                    used ? (hit ? "bg-neon-green/25 text-neon-green" : "bg-white/5 text-pink-accent line-through") : "glass glass-hover text-ink"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
