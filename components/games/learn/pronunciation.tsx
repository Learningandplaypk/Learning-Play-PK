"use client";

import React, { useMemo, useRef, useState } from "react";
import type { GameProps, GameResult } from "@/components/game-shell";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";
import { getLangMeta } from "@/lib/lang-registry";
import { LessonLoading, TtsNote, useLangPack, useLessonScript } from "./lesson-bits";

const LATIN = /^[A-Za-z\u00C0-\u024F\s'-]+$/;

const ROUNDS = 8;

/** Speech recognition with graceful fallback to listen-and-type. */
export default function Pronunciation({ lang = "english", onEnd }: GameProps) {
  const pack = useLangPack(lang);
  const { rtl, family } = useLessonScript(lang);
  const codes = getLangMeta(lang)?.tts ?? ["en-US"];
  const code = codes[0];

  /**
   * `en` is what speech recognition is compared against: the word itself for
   * Latin scripts, the romanization for the rest (recognizers return Latin).
   */
  const words = useMemo(() => {
    if (!pack) return null;
    return shuffle(pack.words.filter((w) => (LATIN.test(w.w) ? w.w : w.r).length <= 14))
      .slice(0, ROUNDS)
      .map((w) => ({
        en: LATIN.test(w.w) ? w.w : w.r,
        native: w.w,
        ur: w.ur,
        meaning: w.en,
      }));
  }, [pack]);
  const [idx, setIdx] = useState(0);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | { ok: boolean; sim: number }>(null);
  const [startedAt] = useState(() => Date.now());
  const recRef = useRef<unknown>(null);

  if (!pack) return <LessonLoading />;
  const word = words?.[idx];
  if (!word) {
    // defensive: empty pool (shouldn't happen with current data) — end cleanly without calling onEnd during render
    return <GameEndZero onEnd={onEnd} />;
  }

  const similarity = (a: string, b: string) => {
    const x = a.toLowerCase().replace(/[^a-z\u0600-\u06FF一-龯ぁ-んァ-ヶ가-힣]/g, "");
    const y = b.toLowerCase().replace(/[^a-z\u0600-\u06FF一-龯ぁ-んァ-ヶ가-힣]/g, "");
    if (!x || !y) return 0;
    const dp = Array.from({ length: x.length + 1 }, () => Array(y.length + 1).fill(0));
    for (let i = 0; i <= x.length; i++) dp[i][0] = i;
    for (let j = 0; j <= y.length; j++) dp[0][j] = j;
    for (let i = 1; i <= x.length; i++)
      for (let j = 1; j <= y.length; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    return 1 - dp[x.length][y.length] / Math.max(x.length, y.length);
  };

  const advance = (sim: number) => {
    const ok = sim >= 0.72;
    if (ok) {
      sfx("correct");
      setScore((s) => s + Math.round(5 + sim * 5));
    } else sfx("wrong");
    setFeedback({ ok, sim });
    setTimeout(() => {
      setFeedback(null);
      setHeard("");
      setTyped("");
      if (idx + 1 >= words.length) {
        const total = score + (ok ? Math.round(5 + sim * 5) : 0);
        onEnd({ score: total, maxScore: words.length * 10, accuracy: total / (words.length * 10), timeMs: Date.now() - startedAt });
      } else setIdx(idx + 1);
    }, 1600);
  };

  const startListening = () => {
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    try {
      const rec = new SR();
      recRef.current = rec;
      rec.lang = code;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        const text = e.results[0][0].transcript as string;
        setHeard(text);
        setListening(false);
        advance(similarity(text, word.en));
      };
      rec.onerror = () => {
        setListening(false);
        setHeard("⚠️ Mic se awaaz nahi aayi — dobara koshish karo ya type karo.");
      };
      rec.onend = () => setListening(false);
      setListening(true);
      rec.start();
    } catch {
      setSupported(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg text-center">
      <TtsNote codes={codes} />
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">{idx + 1}/{words?.length ?? ROUNDS}</span>
        <span className="chip">🎯 {score}</span>
      </div>
      <div className="card p-8">
        <p className="text-xs uppercase tracking-widest text-muted">Yeh word bolein</p>
        <p
          className="mt-3 font-display text-4xl font-black"
          dir={rtl ? "rtl" : "ltr"}
          style={family ? { fontFamily: family } : undefined}
        >
          {word.native}
        </p>
        <p className="mt-1 text-sm text-muted">{word.en}</p>
        <p className="urdu mt-2 text-lg text-brand-ink">{word.ur} — {word.meaning}</p>

        <button
          onClick={startListening}
          disabled={listening || feedback !== null}
          className={`mx-auto mt-7 grid h-24 w-24 place-items-center rounded-full text-4xl transition ${
            listening ? " bg-accent/25 ring-2 ring-accent" : "card"}`}
          aria-label="Bolna shuru karo">
          🎤
        </button>
        <p className="mt-3 text-xs text-muted">
          {listening ? "Sun raha hoon… bolein!" : supported === false ? "Mic recognition available nahi — neeche type karke check karo" : "Tap karo aur clearly bolein"}
        </p>
        {heard && <p className="mt-3 text-sm text-info-ink">Aapne kaha: “{heard}”</p>}

        <div className="mt-5 flex gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="…ya yahan type karke check karo"className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-info/60"aria-label="Type the word"/>
          <button className="btn btn-secondary btn-sm" disabled={!typed || feedback !== null} onClick={() => advance(similarity(typed, word.en))}>
            Check
          </button>
        </div>

        {feedback && (
          <div className={`mt-4 rounded-xl p-3 text-sm font-bold ${feedback.ok ? "bg-brand/15 text-brand-ink" : "bg-accent/15 text-accent-ink"}`}>
            {feedback.ok ? `✅ Zabardast! (${Math.round(feedback.sim * 100)}% match)` : `💋 Aur koshish karo (${Math.round(feedback.sim * 100)}% match) — clearly bolein`}
          </div>
        )}
      </div>
    </div>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

/** Empty-pool fallback: defers the zero-score end to an effect (never call onEnd during render). */
function GameEndZero({ onEnd }: { onEnd: (r: GameResult) => void }) {
  React.useEffect(() => {
    onEnd({ score: 0, maxScore: ROUNDS * 10, accuracy: 0, timeMs: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
