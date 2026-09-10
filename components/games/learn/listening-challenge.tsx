"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";
import { useTts } from "@/lib/tts";
import { getLangMeta } from "@/lib/lang-registry";
import { LessonEmpty, LessonLoading, TtsNote, useLangPack, useLessonScript } from "./lesson-bits";

const ROUNDS = 8;

type Round = { say: string; options: string[]; answer: number; code: string };

export default function ListeningChallenge({ lang = "english", onEnd }: GameProps) {
  const pack = useLangPack(lang);
  const codes = getLangMeta(lang)?.tts ?? ["en-US"];
  const { say } = useTts(codes);
  const { rtl, family } = useLessonScript(lang);

  const rounds = useMemo<Round[] | null>(() => {
    if (!pack) return null;
    // dedicated listening items first (hand-authored), words as a fallback pool
    if (pack.listening.length) {
      return shuffle(pack.listening)
        .slice(0, ROUNDS)
        .map((it) => {
          const opts = shuffle(it.o.map((text, i) => ({ text, correct: i === it.a })));
          return { say: it.t, options: opts.map((o) => o.text), answer: opts.findIndex((o) => o.correct), code: codes[0] };
        });
    }
    const ws = shuffle(pack.words).slice(0, ROUNDS);
    return ws.map((w) => {
      const label = `${w.w} (${w.r})`;
      const wrongs = shuffle(pack.words.filter((x) => x.w !== w.w))
        .slice(0, 2)
        .map((x) => `${x.w} (${x.r})`);
      const opts = shuffle([label, ...wrongs]);
      return { say: w.w, options: opts, answer: opts.indexOf(label), code: codes[0] };
    });
  }, [pack, codes]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [plays, setPlays] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const spokenRef = useRef(false);

  const round = rounds?.[idx];

  useEffect(() => {
    if (!round) return;
    if (!spokenRef.current) {
      spokenRef.current = true;
      setTimeout(() => say(round.say, { rate: 0.85 }), 350);
    }
  }, [round]);

  const replay = () => {
    if (!round) return;
    setPlays((p) => p + 1);
    say(round.say, { rate: 0.85 });
  };

  const choose = (i: number) => {
    if (picked !== null || !round || !rounds) return;
    setPicked(i);
    const ok = i === round.answer;
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
    } else {
      sfx("wrong");
      say(round.say, { rate: 0.85 });
    }
    setTimeout(() => {
      setPicked(null);
      spokenRef.current = false;
      if (idx + 1 >= rounds.length) {
        onEnd({ score: (correct + (ok ? 1 : 0)) * 10 - Math.min(plays, 8), maxScore: rounds.length * 10, accuracy: (correct + (ok ? 1 : 0)) / rounds.length, timeMs: Date.now() - startedAt });
      } else setIdx(idx + 1);
    }, 1300);
  };

  if (!pack) return <LessonLoading />;
  if (!rounds || rounds.length === 0 || !round) return <LessonEmpty onEnd={onEnd} slug={lang} />;

  return (
    <div className="mx-auto max-w-lg text-center">
      <TtsNote codes={codes} />
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{rounds.length}</span>
        <span className="chip">✅ {correct}</span>
        <span className="chip">🔊 replay: {plays}</span>
      </div>
      <button
        onClick={replay}
        className="card mx-auto grid h-32 w-32 place-items-center rounded-full text-5xl"aria-label="Dobara suno">
        <span className="">🔊</span>
      </button>
      <p className="mt-3 text-xs text-muted">Tap karke dobara suno — jo suna woh chuno</p>

      <div className="mt-6 grid gap-2.5">
        {round.options.map((o, i) => {
          const state = picked === null ? "idle" : i === round.answer ? "right" : picked === i ? "wrong" : "dim";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              dir={rtl ? "rtl" : "ltr"}
              style={family ? { fontFamily: family } : undefined}
              className={`rounded-xl border px-4 py-3.5 text-start text-[15px] font-semibold transition ${
                state === "idle"? "card": state === "right"? "border-brand/70 bg-brand/15": state === "wrong"? "shake border-accent/70 bg-accent/15": "opacity-35"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
