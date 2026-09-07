"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { Modal, Progress, useCountUp } from "./ui";
import { levelFromXp, levelTitle } from "@/lib/gamification";
import { usePlayer } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import confetti from "canvas-confetti";
import { Ustad } from "./brand/ustad";
import { fmt } from "@/lib/utils";

type LevelUpState = { level: number | null; show: (l: number) => void; hide: () => void };
export const useLevelUp = create<LevelUpState>((set) => ({
  level: null,
  show: (level) => set({ level }),
  hide: () => set({ level: null }),
}));

/** Watches game submissions and celebrates a level-up once per outcome. */
export function LevelUpHost() {
  const outcome = usePlayer((s) => s.outcome);
  const shownRef = useRef<string | null>(null);
  const show = useLevelUp((s) => s.show);
  const sound = usePlayer((s) => s.sound);

  useEffect(() => {
    if (!outcome?.leveledTo) return;
    const key = `${outcome.slug}:${outcome.xp}:${outcome.coins}:${outcome.leveledTo}`;
    if (shownRef.current === key) return;
    shownRef.current = key;
    show(outcome.leveledTo);
    sfx("levelup");
    if (sound && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.75 }, colors: ["#178A55", "#F5A524", "#12734A"] });
    }
  }, [outcome, show, sound]);

  return <LevelUpModal />;
}

function LevelUpModal() {
  const level = useLevelUp((s) => s.level);
  const hide = useLevelUp((s) => s.hide);
  const xp = usePlayer((s) => s.xp);
  const lv = useMemo(() => levelFromXp(xp), [xp]);
  const shown = useCountUp(level ?? 1, 500, level != null);
  const [display, setDisplay] = useState(1);

  useEffect(() => {
    if (level == null) return;
    setDisplay(level);
  }, [level]);

  const value = level != null ? Math.max(1, Math.min(level, shown || level)) : display;

  return (
    <Modal open={level != null} onClose={hide} title="Level up!">
      <div className="flex flex-col items-center text-center">
        <Ustad mood="celebrate" className="h-28 w-28" />
        <div className="mt-2 font-display text-4xl font-black text-brand-ink tnum">{value}</div>
        <p className="mt-1 text-sm font-bold text-fg">{levelTitle(level ?? 1)}</p>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Mubarak ho! Ab tum level <span className="font-bold text-fg">{level ?? 1}</span> par ho — total{" "}
          <span className="font-bold text-fg tnum">{fmt(xp)}</span> XP.
        </p>
        <div className="mt-5 w-full">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>
              Level {lv.level + 1} tak
            </span>
            <span className="tnum">
              {fmt(lv.into)}/{fmt(lv.need)} XP
            </span>
          </div>
          <Progress value={lv.progress * 100} label={`Level ${lv.level} progress`} />
        </div>
        <button type="button" onClick={hide} className="btn btn-primary btn-lg btn-block mt-6">
          Chalo, aur aage!
        </button>
      </div>
    </Modal>
  );
}
