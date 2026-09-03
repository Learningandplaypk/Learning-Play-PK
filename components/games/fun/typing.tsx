"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const PARAGRAPHS = [
  "Pakistan zindabad. Lahore ka dil jeeta hai apni mehnavi se. Har bachay ko parhna likhna sikhao. Waqt ki pabandi kamyabi ki kunji hai. Mehnat ka koi murad nahi hota.",
  "The quick brown fox jumps over the lazy dog. Practice makes a person perfect and patient. Reading books opens the doors of wisdom and light.",
  "Ilm hasil karna har musalman mard aur aurat par farz hai. Achi soch achi zindagi banati hai. Chai ke bagair subh adhoori hai, yeh baat sab maantay hain.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. Every expert was once a beginner who never gave up.",
];

export default function TypingGame({ onEnd }: GameProps) {
  const para = useMemo(() => PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)], []);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [acc, setAcc] = useState(100);
  const doneRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (startedAt === null || doneRef.current) return;
    const iv = setInterval(() => {
      const secs = (Date.now() - startedAt) / 1000;
      setElapsed(secs);
      const words = typed.trim() ? typed.trim().split(/\s+/).length : 0;
      const correctChars = typed.split("").filter((ch, i) => para[i] === ch).length;
      const accuracy = typed.length ? correctChars / typed.length : 1;
      setWpm(Math.round((words / Math.max(secs, 1)) * 60));
      setAcc(Math.round(accuracy * 100));
      if (typed.length >= para.length) {
        doneRef.current = true;
        clearInterval(iv);
        sfx("win");
        const finalWpm = Math.round((words / Math.max(secs, 1)) * 60);
        const score = Math.round(Math.min(100, finalWpm * 1.4) * (accuracy));
        onEnd({ score, maxScore: 100, accuracy, timeMs: secs * 1000, flag: finalWpm >= 45 ? "typing-fast" : undefined });
      }
    }, 300);
    return () => clearInterval(iv);
  }, [typed, startedAt, para, onEnd]);

  const chars = para.split("").map((ch, i) => {
    const state = i < typed.length ? (typed[i] === ch ? "ok" : "bad") : i === typed.length ? "cur" : "todo";
    return (
      <span
        key={i}
        className={
          state === "ok"
            ? "text-ink"
            : state === "bad"
              ? "bg-pink-accent/30 text-pink-accent"
              : state === "cur"
                ? "animate-pulse-glow bg-electric/40 text-white"
                : "text-muted/60"
        }
      >
        {ch}
      </span>
    );
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex justify-center gap-2 text-sm">
        <span className="chip">⚡ {wpm} WPM</span>
        <span className="chip">🎯 {acc}%</span>
        <span className="chip">⏱️ {elapsed.toFixed(0)}s</span>
      </div>
      <div className="glass p-6 text-lg leading-relaxed tracking-wide">
        {chars}
      </div>
      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => {
          if (startedAt === null) setStartedAt(Date.now());
          if (e.target.value.length <= para.length) setTyped(e.target.value);
        }}
        className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] outline-none focus:border-neon-green/60"
        placeholder="Yahan type karna shuru karo…"
        aria-label="Typing input"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <p className="mt-2 text-center text-xs text-muted">Mistakes laal dikhtay hain — tez bhi sahi bhi!</p>
    </div>
  );
}
