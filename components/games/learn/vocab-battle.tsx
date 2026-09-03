"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { ENGLISH_WORDS } from "@/data/english";
import { getLanguage } from "@/lib/langs";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const PAIRS_PER_ROUND = 5;
const ROUNDS = 3;
const ROUND_TIME = 45;

type Pair = { id: number; left: string; right: string; sub?: string };

export default function VocabBattle({ lang = "english", onEnd }: GameProps) {
  const rounds = useMemo<Pair[][]>(() => {
    const pick = () => {
      if (lang === "english") {
        return shuffle(ENGLISH_WORDS.filter((w) => w.en.length <= 10))
          .slice(0, PAIRS_PER_ROUND)
          .map((w, i) => ({ id: i, left: w.en, right: w.ur }));
      }
      const data = getLanguage(lang);
      return shuffle(data?.words ?? []).slice(0, PAIRS_PER_ROUND).map((w, i) => ({
        id: i,
        left: w.word.length <= 12 ? w.word : w.roman,
        right: w.ur,
        sub: w.en,
      }));
    };
    return Array.from({ length: ROUNDS }, pick);
  }, [lang]);

  const [round, setRound] = useState(0);
  const [lefts, setLefts] = useState<Pair[]>([]);
  const [rights, setRights] = useState<Pair[]>([]);
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongPair, setWrongPair] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(ROUND_TIME);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const pairs = rounds[round];
    setLefts(shuffle(pairs));
    setRights(shuffle(pairs));
    setMatched([]);
    setSelLeft(null);
    setLeft(ROUND_TIME);
  }, [round, rounds]);

  useEffect(() => {
    const iv = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(iv);
          finishRound(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const finishRound = (completed: boolean) => {
    if (round + 1 >= ROUNDS) {
      const total = score + (completed ? PAIRS_PER_ROUND * 10 : 0);
      onEnd({ score: Math.round(total), maxScore: ROUNDS * PAIRS_PER_ROUND * 10, accuracy: Math.min(1, total / (ROUNDS * PAIRS_PER_ROUND * 10)), timeMs: Date.now() - startedAt, words: rounds.flat().map((p) => p.left) });
    } else {
      if (completed) setScore((s) => s + PAIRS_PER_ROUND * 10);
      setRound(round + 1);
    }
  };

  const tapLeft = (id: number) => {
    if (matched.includes(id)) return;
    sfx("click");
    setSelLeft(id);
  };

  const tapRight = (id: number) => {
    if (matched.includes(id) || selLeft === null) return;
    if (selLeft === id) {
      sfx("correct");
      const nm = [...matched, id];
      setMatched(nm);
      setSelLeft(null);
      if (nm.length === PAIRS_PER_ROUND) {
        sfx("win");
        setTimeout(() => finishRound(true), 700);
      }
    } else {
      sfx("wrong");
      setWrongPair(id);
      setTimeout(() => setWrongPair(null), 500);
      setSelLeft(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">Round {round + 1}/{ROUNDS}</span>
        <span className="chip">⏱️ {left}s</span>
        <span className="chip">🎯 {score}</span>
      </div>
      <p className="mb-3 text-center text-xs text-muted">Urdu meaning se English word milao (ya {rounds[0][0]?.sub ? "native word" : "word"} se)</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2.5">
          {lefts.map((p) => (
            <button
              key={p.id}
              onClick={() => tapLeft(p.id)}
              disabled={matched.includes(p.id)}
              className={`glass w-full px-3 py-3 text-left font-display text-sm font-bold transition ${
                matched.includes(p.id) ? "opacity-30 line-through" : selLeft === p.id ? "!border-neon-green/80 bg-neon-green/10" : ""
              }`}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          {rights.map((p) => (
            <button
              key={p.id}
              onClick={() => tapRight(p.id)}
              disabled={matched.includes(p.id)}
              className={`urdu glass w-full px-3 py-3 text-right text-sm transition ${
                matched.includes(p.id) ? "opacity-30" : wrongPair === p.id ? "shake !border-pink-accent/80" : "hover:!border-electric/60"
              }`}
            >
              {p.right}
              {p.sub && <span className="mt-0.5 block text-[10px] text-muted ltr:text-left" style={{ direction: "ltr" }}>{p.sub}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
