"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { LessonEmpty, LessonLoading, useLangPack, useLessonScript } from "./lesson-bits";
import { sfx } from "@/lib/sfx";

const TOTAL = 10;
const ENEMY_HP = 3;
const PLAYER_HP = 3;

export default function GrammarQuest({ lang = "english", onEnd }: GameProps) {
  const pack = useLangPack(lang);
  const { rtl, family } = useLessonScript(lang);
  const questions = useMemo(
    () =>
      pack
        ? shuffle(pack.grammar)
            .slice(0, TOTAL)
            .map((q) => ({ ...q, opts: shuffle(q.o.map((text, i) => ({ text, correct: i === q.a }))) }))
        : null,
    [pack]
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [enemyHp, setEnemyHp] = useState(ENEMY_HP);
  const [playerHp, setPlayerHp] = useState(PLAYER_HP);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [slain, setSlain] = useState(0);
  const [startedAt] = useState(() => Date.now());

  // never undefined: the guards below the hooks bail out before rendering,
  // and callbacks (setTimeout bodies) need a stable shape to read.
  const q = questions?.[idx] ?? { q: "", o: [] as string[], a: 0, why: "", urWhy: "", opts: [] as Array<{ text: string; correct: boolean }> };

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
      const finished = idx + 1 >= (questions?.length ?? 0);
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
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,46,151,.12),transparent_65%)]" />
        <div className="relative flex items-end justify-between">
          <div className="text-center">
            <div className="text-5xl drop-">🦸</div>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: PLAYER_HP }).map((_, i) => (
                <span key={i} className={`text-sm ${i < playerHp ? "" : "opacity-20 grayscale"}`}>❤️</span>
              ))}
            </div>
          </div>
          <div className="pb-2 font-display text-lg font-black text-accent-ink">⚡ VS ⚡</div>
          <div className="text-center">
            <div className={`text-5xl drop- ${picked !== null && q.opts[picked].correct ? "animate-pulse opacity-60" : ""}`}>👾</div>
            <div className="mt-1 flex justify-center gap-1">
              {Array.from({ length: ENEMY_HP }).map((_, i) => (
                <span key={i} className={`h-2.5 w-6 rounded-full ${i < enemyHp ? "bg-accent " : "bg-surface-2"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="relative mt-3 flex justify-center gap-2 text-[11px]">
          <span className="chip">{idx + 1}/{TOTAL}</span>
          <span className="chip">⚔️ {slain} monsters slain</span>
          {streak >= 2 && <span className="chip border-accent/50 text-accent-ink">🔥 {streak}x — double damage!</span>}
        </div>
      </div>

      {/* question */}
      <div className="card mt-4 p-6">
        <p className="font-display text-lg font-bold leading-relaxed">{q.q}</p>
        <div className="mt-4 grid gap-2.5">
          {q.opts.map((o, i) => {
            const state = picked === null ? "idle" : o.correct ? "right" : picked === i ? "wrong" : "dim";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-start text-[15px] font-semibold transition ${
                  state === "idle"? "card": state === "right"? "border-brand/70 bg-brand/15": state === "wrong"? "shake border-accent/70 bg-accent/15": "opacity-35"}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-xs font-black">{["A", "B", "C", "D"][i]}</span>
                {o.text}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <p className="mt-3 text-sm text-brand-ink" dir={rtl ? "rtl" : "ltr"} style={family ? { fontFamily: family } : undefined}>
            💡 {q.why}
            <span className="block text-xs text-muted">{q.urWhy}</span>
          </p>
        )}
      </div>
    </div>
  );
}
