"use client";

import React, { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { Modal, Button, Progress } from "./ui";
import { levelFromXp, levelTitle } from "@/lib/gamification";
import { usePlayer } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import confetti from "canvas-confetti";

type LevelUpState = { level: number | null; show: (l: number) => void; hide: () => void };
export const useLevelUp = create<LevelUpState>((set) => ({
  level: null,
  show: (level) => set({ level }),
  hide: () => set({ level: null }),
}));

/** Watches game submissions and pops the animated 3D-ish level-up modal. */
export function LevelUpHost() {
  const outcome = usePlayer((s) => s.outcome);
  const shownRef = useRef<number | null>(null);
  const show = useLevelUp((s) => s.show);

  useEffect(() => {
    if (outcome?.leveledTo && shownRef.current !== outcome.xp + outcome.coins) {
      shownRef.current = outcome.xp + outcome.coins;
      show(outcome.leveledTo);
      sfx("levelup");
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.7 }, colors: ["#39ff14", "#2d7cff", "#b026ff", "#ff2e97"] });
    }
  }, [outcome, show]);

  return <LevelUpModal />;
}

function LevelUpModal() {
  const level = useLevelUp((s) => s.level);
  const hide = useLevelUp((s) => s.hide);
  const xp = usePlayer((s) => s.xp);
  const [display, setDisplay] = useState(1);
  const lv = usePlayer((s) => levelFromXp(s.xp));

  useEffect(() => {
    if (level == null) return;
    setDisplay(level);
    const iv = setInterval(() => {
      setDisplay((d) => {
        if (d >= level) {
          clearInterval(iv);
          return level;
        }
        return d + 1;
      });
    }, 70);
    return () => clearInterval(iv);
  }, [level]);

  return (
    <Modal open={level != null} onClose={hide}>
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-32 w-32">
          <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-neon-green/60" />
          <div
            className="absolute inset-2 rounded-full opacity-90"
            style={{ background: "conic-gradient(from 180deg,#39ff14,#2d7cff,#b026ff,#ff2e97,#39ff14)", filter: "blur(6px)" }}
          />
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-bg-900/90">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted">Level</div>
            <div className="font-display text-4xl font-black text-gradient">{display}</div>
          </div>
        </div>
        <h3 className="font-display text-2xl font-extrabold">
          <span className="text-gradient">Mubarak ho! Level Up!</span>
        </h3>
        <p className="mt-2 text-sm text-muted">
          Ab tum <span className="font-bold text-neon-green">{levelTitle(level ?? 1)}</span> ho — total {xp} XP
        </p>
        <Progress value={lv.progress * 100} className="mx-auto mt-4 max-w-xs" />
        <Button className="mt-6 w-full" onClick={hide}>
          Chalo, aur aage! 🚀
        </Button>
      </div>
    </Modal>
  );
}
