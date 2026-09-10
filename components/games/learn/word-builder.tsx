"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";
import { LessonEmpty, LessonLoading, useLangPack, useLessonScript } from "./lesson-bits";

/** Latin-script words are built letter-by-letter; everything else uses the romanization. */
const LATIN = /^[A-Za-z\u00C0-\u024F\s'-]+$/;

type Round = { target: string; display: string; hintUr: string; hintEn: string };

const ROUNDS = 8;

export default function WordBuilder({ lang = "english", onEnd }: GameProps) {
  const pack = useLangPack(lang);
  const { rtl, family } = useLessonScript(lang);
  const rounds = useMemo<Round[] | null>(() => {
    if (!pack) return null;
    const pool = pack.words.filter((w) => LATIN.test(w.w) || (w.r.length >= 3 && w.r.length <= 12));
    return shuffle(pool)
      .slice(0, ROUNDS)
      .map((w) => ({
        target: LATIN.test(w.w) ? w.w : w.r,
        display: w.w,
        hintUr: w.ur,
        hintEn: w.en,
      }));
  }, [pack]);

  const [idx, setIdx] = useState(0);
  const [built, setBuilt] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [startedAt] = useState(() => Date.now());

  if (!pack) return <LessonLoading />;
  if (!rounds || rounds.length === 0) return <LessonEmpty onEnd={onEnd} slug={lang} />;

  const round = rounds[idx];
  const letters = useMemo(() => shuffle(round.target.split("").map((ch, i) => ({ ch, i }))), [round.target]);
  const done = built.length === round.target.length;
  const current = built.map((i) => letters[i].ch).join("");

  const tap = (i: number) => {
    if (built.includes(i)) return;
    sfx("click");
    setBuilt([...built, i]);
  };
  const undo = () => {
    sfx("click");
    setBuilt(built.slice(0, -1));
  };

  React.useEffect(() => {
    if (!done) return;
    const ok = current === round.target;
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
    } else {
      sfx("wrong");
      setWrongFlash(true);
    }
    const t = setTimeout(() => {
      setWrongFlash(false);
      setBuilt([]);
      if (idx + 1 >= rounds.length) {
        onEnd({ score: (correct + (ok ? 1 : 0)) * 10, maxScore: rounds.length * 10, accuracy: (correct + (ok ? 1 : 0)) / rounds.length, timeMs: Date.now() - startedAt, words: rounds.map((r) => r.target) });
      } else setIdx(idx + 1);
    }, ok ? 550 : 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{rounds.length}</span>
        <span className="chip">✅ {correct}</span>
      </div>
      <div className="card p-6">
        <p className="text-xs uppercase tracking-widest text-muted">Yeh word banao</p>
        <p className={`urdu mt-2 text-3xl font-bold ${wrongFlash ? "text-accent-ink" : "text-brand-ink"}`}>{round.hintUr}</p>
        {round.hintEn && <p className="mt-1 text-xs text-muted">{round.hintEn}</p>}
        <p
          className="mt-3 text-2xl font-extrabold text-fg"
          dir={rtl ? "rtl" : "ltr"}
          style={family ? { fontFamily: family } : undefined}
        >
          {round.display}
        </p>

        {/* built word */}
        <div className={`mt-6 flex min-h-16 flex-wrap items-center justify-center gap-1.5 ${wrongFlash ? "shake" : ""}`}>
          {round.target.split("").map((_, i) => {
            const filled = built[i] !== undefined;
            return (
              <span
                key={i}
                className={`grid h-11 w-9 place-items-center rounded-lg border-b-2 font-display text-lg font-black sm:h-12 sm:w-10 ${
                  filled ? "border-brand bg-brand/15 text-fg" : "border-line bg-surface-2"}`}
              >
                {filled ? letters[built[i]].ch : ""}
              </span>
            );
          })}
        </div>

        {/* letter tiles */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {letters.map((l, i) => (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={built.includes(i)}
              className={`h-12 w-11 rounded-xl font-display text-lg font-black transition-all sm:h-14 sm:w-12 ${
                built.includes(i) ? "scale-90 opacity-25" : "card text-fg"}`}
              aria-label={`Letter ${l.ch}`}
            >
              {l.ch}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-center gap-2">
          <button className="chip-btn hover:text-fg" onClick={undo}>
            ⌫ Wapis
          </button>
          <button className="chip-btn hover:text-fg" onClick={() => { setBuilt([]); setWrongFlash(false); }}>
            🧹 Clear
          </button>
        </div>
      </div>
    </div>
  );
}
