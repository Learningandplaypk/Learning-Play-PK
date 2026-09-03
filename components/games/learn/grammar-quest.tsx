"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { GRAMMAR } from "@/data/english/grammar";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const TOTAL = 10;
const ENEMY_HP = 3;
const PLAYER_HP = 3;

export default function GrammarQuest({ onEnd }: GameProps) {
  const questions = useMemo(
    () =>
      shuffle(GRAMMAR)
        .slice(0, TOTAL)
        .map((q) => ({ ...q, opts: shuffle(q.o.map((text, i) => ({ text, correct: i === q.a }))) })),
    []
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [enemyHp, setEnemyHp] = useState(ENEMY_HP);
  const [playerHp, setPlayerHp] = useState(PLAYER_HP);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [slain, setSlain] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const q = questions[idx];

  const advance = (ok: boolean) => {
    let nhp = enemyHp;
    let nplayer = playerHp;
    let nslain = slain;
    if (ok) {
      nhp -= 1 + (streak >= 3 ? 1 : 0); // streak = double damage
      if (nhp <= 0) {
        nslain += 1;
        nhp = ENEMY_HP;
      }
    } else {
      nplayer -= 1;
    }
    setEnemyHp(nhp);
    setPlayerHp(nplayer);
    setSlain(nslain);

    setTimeout(() => {
      setPicked(null);
      const gameOver = !ok && nplayer <= 0;
      const finished = idx + 1 >= questions.length;
      if (gameOver || finished) {
        const score = (correct + (ok ? 1 : 0)) * 15 + nslain * 10;
        onEnd({ score, maxScore: TOTAL * 15 + 50, accuracy: (correct + (ok ? 1 : 0)) / Math.max(1, idx + 1), timeMs: Date.now() - startedAt });
      } else {
        setIdx(idx + 1);
        if (!ok) setStreak(0);
        else setStreak(streak + 1);
      }
    }, 1500);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = q.opts[i].correct;
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
    } else sfx("wrong");
    advance(ok);
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* battle scene */}
      <div className="glass relative overflow-hidden p-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,46,151,.12),transparent_65%)]" />
        <div className="relative flex items-end justify-between">
          <div className="text-center">
            <div className="text-5xl drop-shadow-[0_0_20px_rgba(57,255,20,.6)]">🦸</div>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: PLAYER_HP }).map((_, i) => (
                <span key={i} className={`text-sm ${i < playerHp ? "" : "opacity-20 grayscale"}`}>❤️</span>
              ))}
            </div>
          </div>
          <div className="pb-2 font-display text-lg font-black text-pink-accent">⚡ VS ⚡</div>
          <div className="text-center">
            <div className={`text-5xl drop-shadow-[0_0_20px_rgba(255,46,151,.7)] ${picked !== null && q.opts[picked].correct ? "animate-pulse opacity-60" : ""}`}>👾</div>
            <div className="mt-1 flex justify-center gap-1">
              {Array.from({ length: ENEMY_HP }).map((_, i) => (
                <span key={i} className={`h-2.5 w-6 rounded-full ${i < enemyHp ? "bg-pink-accent shadow-[0_0_8px_rgba(255,46,151,.8)]" : "bg-white/15"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="relative mt-3 flex justify-center gap-2 text-[11px]">
          <span className="chip">{idx + 1}/{TOTAL}</span>
          <span className="chip">⚔️ {slain} monsters slain</span>
          {streak >= 2 && <span className="chip border-neon-orange/50 text-neon-orange">🔥 {streak}x — double damage!</span>}
        </div>
      </div>

      {/* question */}
      <div className="glass mt-4 p-6">
        <p className="font-display text-lg font-bold leading-relaxed">{q.q}</p>
        <div className="mt-4 grid gap-2.5">
          {q.opts.map((o, i) => {
            const state = picked === null ? "idle" : o.correct ? "right" : picked === i ? "wrong" : "dim";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold transition ${
                  state === "idle"
                    ? "glass glass-hover"
                    : state === "right"
                      ? "border-neon-green/70 bg-neon-green/15"
                      : state === "wrong"
                        ? "shake border-pink-accent/70 bg-pink-accent/15"
                        : "opacity-35"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 font-display text-xs font-black">{["A", "B", "C", "D"][i]}</span>
                {o.text}
              </button>
            );
          })}
        </div>
        {picked !== null && <p className="mt-3 text-sm text-neon-green">💡 {q.why}</p>}
      </div>
    </div>
  );
}
