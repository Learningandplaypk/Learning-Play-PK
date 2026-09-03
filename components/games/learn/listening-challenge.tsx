"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { ENGLISH_WORDS, SENTENCES } from "@/data/english";
import { getLanguage } from "@/lib/langs";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const ROUNDS = 8;

type Round = { say: string; options: string[]; answer: number; code: string };

function speak(text: string, code: string) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = code;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unavailable */
  }
}

export default function ListeningChallenge({ lang = "english", onEnd }: GameProps) {
  const code = lang === "english" ? "en-US" : (getLanguage(lang)?.code ?? "en-US");

  const rounds = useMemo<Round[]>(() => {
    if (lang === "english") {
      const sentences = shuffle(SENTENCES.filter((s) => s.correct.length <= 7)).slice(0, 5);
      const words = shuffle(ENGLISH_WORDS.filter((w) => w.lv === 1)).slice(0, 3);
      return [
        ...sentences.map((s) => {
          const say = s.correct.join(" ");
          const wrongs = shuffle(SENTENCES.filter((x) => x !== s)).slice(0, 2).map((x) => x.correct.join(" "));
          const opts = shuffle([say, ...wrongs]);
          return { say, options: opts, answer: opts.indexOf(say), code };
        }),
        ...words.map((w) => {
          const wrongs = shuffle(ENGLISH_WORDS.filter((x) => x.en !== w.en)).slice(0, 2).map((x) => x.en);
          const opts = shuffle([w.en, ...wrongs]);
          return { say: w.en, options: opts, answer: opts.indexOf(w.en), code };
        }),
      ];
    }
    const data = getLanguage(lang);
    const ws = shuffle(data?.words ?? []).slice(0, ROUNDS);
    return ws.map((w) => {
      const wrongs = shuffle((data?.words ?? []).filter((x) => x.word !== w.word)).slice(0, 2).map((x) => `${x.word} (${x.roman})`);
      const label = `${w.word} (${w.roman})`;
      const opts = shuffle([label, ...wrongs]);
      return { say: w.word, options: opts, answer: opts.indexOf(label), code };
    });
  }, [lang]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [plays, setPlays] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const spokenRef = useRef(false);

  const round = rounds[idx];

  useEffect(() => {
    if (!spokenRef.current) {
      spokenRef.current = true;
      setTimeout(() => speak(round.say, round.code), 350);
    }
  }, [round]);

  const replay = () => {
    setPlays((p) => p + 1);
    speak(round.say, round.code);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === round.answer;
    if (ok) {
      sfx("correct");
      setCorrect((c) => c + 1);
    } else {
      sfx("wrong");
      speak(round.say, round.code);
    }
    setTimeout(() => {
      setPicked(null);
      spokenRef.current = false;
      if (idx + 1 >= rounds.length) {
        onEnd({ score: (correct + (ok ? 1 : 0)) * 10 - Math.min(plays, 8), maxScore: rounds.length * 10, accuracy: (correct + (ok ? 1 : 0)) / rounds.length, timeMs: Date.now() - startedAt });
      } else setIdx(idx + 1);
    }, 1300);
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{rounds.length}</span>
        <span className="chip">✅ {correct}</span>
        <span className="chip">🔊 replay: {plays}</span>
      </div>
      <button
        onClick={replay}
        className="glass glass-hover mx-auto grid h-32 w-32 place-items-center rounded-full text-5xl"
        aria-label="Dobara suno"
      >
        <span className="animate-pulse-glow">🔊</span>
      </button>
      <p className="mt-3 text-xs text-muted">Tap karke dobara suno — jo suna woh chuno</p>

      <div className="mt-6 grid gap-2.5">
        {round.options.map((o, i) => {
          const state = picked === null ? "idle" : i === round.answer ? "right" : picked === i ? "wrong" : "dim";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`rounded-xl border px-4 py-3.5 text-left text-[15px] font-semibold transition ${
                state === "idle"
                  ? "glass glass-hover"
                  : state === "right"
                    ? "border-neon-green/70 bg-neon-green/15"
                    : state === "wrong"
                      ? "shake border-pink-accent/70 bg-pink-accent/15"
                      : "opacity-35"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
