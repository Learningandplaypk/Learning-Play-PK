"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import type { QuizQ } from "@/lib/quiz-types";
import { GK } from "@/data/quiz/gk";
import { HISTORY } from "@/data/quiz/history";
import { SCIENCE } from "@/data/quiz/science";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const LADDER = [
  { amt: "1,000", safe: false }, { amt: "2,000", safe: false }, { amt: "3,000", safe: false }, { amt: "5,000", safe: true }, { amt: "10,000", safe: false },
  { amt: "20,000", safe: false }, { amt: "40,000", safe: false }, { amt: "80,000", safe: true }, { amt: "150,000", safe: false }, { amt: "300,000", safe: false },
  { amt: "600,000", safe: false }, { amt: "1,200,000", safe: true }, { amt: "2,400,000", safe: false }, { amt: "5,000,000", safe: false }, { amt: "10,000,000", safe: false },
];

type Lifelines = { fifty: boolean; poll: boolean; skip: boolean };

export default function Millionaire({ onEnd }: GameProps) {
  const questions = useMemo(() => {
    const bank = shuffle([...GK, ...HISTORY, ...SCIENCE]);
    return bank.slice(0, 15).map((q) => ({ ...q, opts: shuffle(q.o.map((text, i) => ({ text, correct: i === q.a }))) }));
  }, []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [lifelines, setLifelines] = useState<Lifelines>({ fifty: true, poll: true, skip: true });
  const [hidden, setHidden] = useState<number[]>([]);
  const [poll, setPoll] = useState<number[] | null>(null);
  const [message, setMessage] = useState("Chalo shuru karein! Sawal 1 — Rs. 1,000 ke liye.");
  const [stage, setStage] = useState<"play" | "won" | "lost" | "walked">("play");
  const [wonIdx, setWonIdx] = useState(-1);

  const q = questions[idx];

  const securedIdx = useMemo(() => {
    let best = -1;
    for (let i = 0; i <= wonIdx; i++) if (LADDER[i]?.safe) best = i;
    return best;
  }, [wonIdx]);

  const useFifty = () => {
    if (!lifelines.fifty || picked !== null) return;
    const wrongs = q.opts.map((o, i) => (o.correct ? -1 : i)).filter((i) => i >= 0);
    const toHide = shuffle(wrongs).slice(0, 2);
    setHidden(toHide);
    setLifelines({ ...lifelines, fifty: false });
    setMessage("50-50 use kiya — 2 ghalat options hat gaye!");
    sfx("whoosh");
  };

  const usePoll = () => {
    if (!lifelines.poll || picked !== null) return;
    const correctIdx = q.opts.findIndex((o) => o.correct);
    const weights = q.opts.map((_, i) => {
      if (hidden.includes(i)) return 0;
      if (i === correctIdx) return 45 + Math.random() * 40;
      return Math.random() * (100 - 60) / 3;
    });
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    setPoll(weights.map((w) => Math.round((w / total) * 100)));
    setLifelines({ ...lifelines, poll: false });
    setMessage("Audience ne vote diya — dekho aur faisla karo!");
    sfx("whoosh");
  };

  const useSkip = () => {
    if (!lifelines.skip || picked !== null) return;
    setLifelines({ ...lifelines, skip: false });
    setMessage("Sawal skip! Agle sawal par jao (koi paisa nahi).");
    setIdx(idx + 1);
    sfx("whoosh");
  };

  const settle = (outcome: "won" | "lost" | "walked", finalIdx: number) => {
    setStage(outcome);
    setWonIdx(finalIdx);
    if (outcome === "won") sfx("win");
    else if (outcome === "lost") sfx("lose");
    const prizeIdx = outcome === "lost" ? securedIdx : finalIdx;
    const score = prizeIdx < 0 ? 0 : Math.round(((prizeIdx + 1) / 15) * 150);
    onEnd({
      score,
      maxScore: 150,
      accuracy: (finalIdx + 1) / 15,
      timeMs: (finalIdx + 1) * 25000,
      quizCorrect: outcome === "lost" ? Math.max(0, finalIdx) : finalIdx + 1,
    });
  };

  const choose = (i: number) => {
    if (picked !== null || hidden.includes(i)) return;
    setPicked(i);
    setTimeout(() => {
      if (q.opts[i].correct) {
        sfx("correct");
        const nextIdx = idx + 1;
        setWonIdx(idx);
        if (nextIdx >= 15) {
          setMessage("🎉 Crorepati! Rs. 10,000,000 jeet gaye!");
          setPicked(null);
          settle("won", 14);
        } else {
          setMessage(`Sahi jawab! ✅ Ab Rs. ${LADDER[nextIdx].amt} ke liye khelo.`);
          setPicked(null);
          setHidden([]);
          setPoll(null);
          setIdx(nextIdx);
        }
      } else {
        sfx("lose");
        const safe = securedIdx >= 0 ? `Rs. ${LADDER[securedIdx].amt} (safe level)` : "Rs. 0";
        setMessage(`Ghalat! ❌ Tum ${safe} le kar rahay.`);
        settle("lost", idx - 1);
      }
    }, 1400);
  };

  const quizCorrectTotal = stage === "lost" ? wonIdx + 1 : stage === "won" ? 15 : wonIdx + 1;

  return (
    <div className="mx-auto max-w-xl">
      {/* stage header */}
      <div className="glass relative overflow-hidden p-5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,124,255,.25),transparent_60%)]" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.4em] text-neon-orange">Hot Seat</div>
          <div className="font-display text-2xl font-black text-gradient">
            Rs. {idx < 15 ? LADDER[idx].amt : "10,000,000"}
          </div>
          <p className="mt-1 text-xs text-muted">{message}</p>
        </div>
      </div>

      {/* ladder mini */}
      <div className="mt-3 grid grid-cols-5 gap-1 text-[10px]">
        {LADDER.slice().reverse().map((l, i) => {
          const realIdx = 14 - i;
          const current = realIdx === idx && stage === "play";
          const secured = realIdx <= wonIdx && wonIdx >= 0;
          const safe = l.safe;
          return (
            <div
              key={realIdx}
              className={`rounded px-1.5 py-1 text-center font-bold ${
                current ? "bg-neon-orange/30 text-neon-orange ring-1 ring-neon-orange" : secured ? "bg-neon-green/20 text-neon-green" : safe ? "bg-white/10 text-white" : "text-muted"
              }`}
            >
              {safe ? "🔒 " : ""}{realIdx + 1}. {l.amt}
            </div>
          );
        })}
      </div>

      {/* question */}
      {stage === "play" && idx < 15 && (
        <div className="glass mt-4 p-6">
          <p className="font-display text-base font-bold leading-relaxed sm:text-lg">{q.q}</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {q.opts.map((o, i) => {
              const isHidden = hidden.includes(i);
              const state = picked === null ? "idle" : o.correct ? "right" : picked === i ? "wrong" : "dim";
              return (
                <button
                  key={i}
                  disabled={isHidden}
                  onClick={() => choose(i)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    isHidden
                      ? "border-white/5 bg-white/[0.02] opacity-20 line-through"
                      : state === "idle"
                        ? "border-white/15 bg-white/5 hover:border-neon-orange/70"
                        : state === "right"
                          ? "border-neon-green/80 bg-neon-green/20"
                          : state === "wrong"
                            ? "shake border-pink-accent/80 bg-pink-accent/20"
                            : "opacity-40"
                  }`}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-black">{["A", "B", "C", "D"][i]}</span>
                  <span className="flex-1">{o.text}</span>
                  {poll && <span className="text-[11px] text-electric">{poll[i]}%</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* lifelines */}
      {stage === "play" && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button className={`btn btn-sm ${lifelines.fifty ? "btn-pink" : "btn-ghost"}`} disabled={!lifelines.fifty} onClick={useFifty}>
            ✂️ 50-50
          </button>
          <button className={`btn btn-sm ${lifelines.poll ? "btn-pink" : "btn-ghost"}`} disabled={!lifelines.poll} onClick={usePoll}>
            👥 Audience Poll
          </button>
          <button className={`btn btn-sm ${lifelines.skip ? "btn-pink" : "btn-ghost"}`} disabled={!lifelines.skip} onClick={useSkip}>
            ⏭️ Skip
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => settle("walked", wonIdx)}>
            🚪 Quit with money
          </button>
        </div>
      )}

      {stage !== "play" && (
        <div className="glass mt-4 p-6 text-center">
          <div className="text-4xl">{stage === "won" ? "🏆" : stage === "lost" ? "💔" : "🤝"}</div>
          <h3 className="mt-2 font-display text-2xl font-black text-gradient">
            {stage === "won" ? "Crorepati!" : stage === "lost" ? "Khatam!" : "Sahi faisla!"}
          </h3>
          <p className="mt-1 text-sm text-muted">
            Jeet: Rs. {stage === "won" ? LADDER[14].amt : stage === "lost" ? (securedIdx >= 0 ? LADDER[securedIdx].amt : "0") : wonIdx >= 0 ? LADDER[wonIdx].amt : "0"} • Sahi jawabat: {quizCorrectTotal}
          </p>
        </div>
      )}
    </div>
  );
}
