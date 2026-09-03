"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const PADS = [
  { c: "#39ff14", glow: "rgba(57,255,20,.85)", tone: 330 },
  { c: "#2d7cff", glow: "rgba(45,124,255,.85)", tone: 415 },
  { c: "#b026ff", glow: "rgba(176,38,255,.85)", tone: 494 },
  { c: "#ff2e97", glow: "rgba(255,46,151,.85)", tone: 587 },
];

function playTone(freq: number, dur = 0.22) {
  try {
    const AC = window.AudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.05);
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio unavailable */
  }
}

export default function SequenceGame({ onEnd }: GameProps) {
  const [seq, setSeq] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [phase, setPhase] = useState<"watch" | "input" | "over">("watch");
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    nextRound([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextRound = (prev: number[]) => {
    const ns = [...prev, Math.floor(Math.random() * 4)];
    setSeq(ns);
    setRound(ns.length);
    setPhase("watch");
    setStep(0);
    ns.forEach((pad, i) => {
      setTimeout(() => {
        setActive(pad);
        playTone(PADS[pad].tone);
        setTimeout(() => setActive(null), 320);
      }, 620 * i + 500);
    });
    setTimeout(() => setPhase("input"), 620 * ns.length + 600);
  };

  const tap = (pad: number) => {
    if (phase !== "input") return;
    setActive(pad);
    playTone(PADS[pad].tone, 0.14);
    setTimeout(() => setActive(null), 160);
    if (seq[step] === pad) {
      if (step + 1 === seq.length) {
        sfx("correct");
        setTimeout(() => nextRound(seq), 550);
      } else setStep(step + 1);
    } else {
      sfx("wrong");
      setPhase("over");
      const score = (round - 1) * 12;
      onEnd({ score, maxScore: 240, accuracy: Math.min(1, round / 20), timeMs: round * 5000 });
    }
  };

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">🔁 Round {round}</span>
        <span className="chip">{phase === "watch" ? "👀 Dekho…" : phase === "input" ? "👆 Repeat karo" : "💔 Galat!"}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PADS.map((p, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            disabled={phase !== "input"}
            aria-label={`Pad ${i + 1}`}
            className="aspect-square rounded-3xl border transition-all duration-100 disabled:cursor-default"
            style={{
              background: active === i ? p.glow : `${p.c}22`,
              borderColor: active === i ? p.c : `${p.c}55`,
              boxShadow: active === i ? `0 0 60px ${p.glow}` : "none",
              transform: active === i ? "scale(0.96)" : "scale(1)",
            }}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Simon kehta hai — pattern yaad karo aur repeat karo. Har round mein ek kadam barhta hai.</p>
    </div>
  );
}
