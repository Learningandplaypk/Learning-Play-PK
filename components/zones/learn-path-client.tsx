"use client";

import React from "react";
import Link from "next/link";
import { LEARN_GAME_DATA } from "@/lib/games-data";
import { langFlag, langLabel } from "@/lib/lang-paths";
import { TiltCard, Progress } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { fmt } from "@/lib/utils";

/** Learning path: winding Duolingo-style nodes + the 8 games of this language. */
export function LearnPathClient({ lang }: { lang: string }) {
  const label = langLabel(lang)!;
  const flag = langFlag(lang);
  const games = LEARN_GAME_DATA.filter((g) => !g.langs || g.langs.includes(lang));
  const wordsLearned = usePlayer((s) => s.wordsLearned.length);
  const xp = usePlayer((s) => s.xp);
  const results = usePlayer((s) => s.results);
  const playsBySlug = new Map<string, number>();
  results.forEach((r) => playsBySlug.set(r.slug, (playsBySlug.get(r.slug) ?? 0) + 1));

  // winding path rows: alternate offsets
  const rows: Array<typeof games> = [];
  for (let i = 0; i < games.length; i += 3) rows.push(games.slice(i, i + 3));

  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-4xl pb-28 pt-28">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 animate-float place-items-center rounded-3xl bg-gradient-to-br from-electric/30 via-neon-purple/25 to-neon-green/25 text-4xl shadow-[0_0_50px_-10px_rgba(45,124,255,.7)]">{flag}</div>
        <h1 className="font-display text-3xl font-black sm:text-5xl">
          <span className="text-gradient">{label} Seekho</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          {fmt(xp)} XP • {fmt(wordsLearned)} words explored • Neeche winding path se shuru karo
        </p>
        <Progress value={Math.min(100, wordsLearned)} className="mx-auto mt-4 max-w-sm" />
      </div>

      {/* winding lesson path */}
      <div className="relative mx-auto max-w-2xl">
        <div className="absolute bottom-8 left-1/2 top-8 -z-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-neon-green/50 via-electric/50 to-neon-purple/50 opacity-40" />
        {rows.map((row, ri) => (
          <div key={ri} className="relative z-10 mb-5 flex justify-center gap-6 sm:gap-14" style={{ transform: `translateX(${ri % 2 === 0 ? "-6%" : "6%"})` }}>
            {row.map((g, ci) => {
              const plays = playsBySlug.get(g.slug) ?? 0;
              return (
                <Link
                  key={g.slug}
                  href={`/learn/${lang}/${g.slug}`}
                  className="group flex flex-col items-center gap-1.5"
                  aria-label={`${g.title}`}
                >
                  <span className={`relative grid h-16 w-16 place-items-center rounded-full border-2 text-2xl transition-all duration-300 sm:h-20 sm:w-20 sm:text-3xl ${
                    plays > 0
                      ? "border-neon-green bg-neon-green/15 shadow-[0_0_26px_-4px_rgba(57,255,20,.7)]"
                      : "border-white/20 bg-bg-800 group-hover:border-electric group-hover:shadow-[0_0_26px_-6px_rgba(45,124,255,.8)]"
                  }`}>
                    {g.emoji}
                    {plays > 0 && (
                      <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-neon-green font-display text-[10px] font-black text-black">
                        {Math.min(9, plays)}
                      </span>
                    )}
                  </span>
                  <span className="max-w-24 text-center text-[10px] font-bold leading-tight text-muted group-hover:text-ink sm:text-xs">{g.title}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <TiltCard className="p-5">
          <h3 className="font-display font-bold">💡 Roz ka target</h3>
          <p className="mt-2 text-sm text-muted">Roz 1 lesson game khelo — 3 lessons daily free hain. Streak jalao aur daily chest kholo!</p>
          <Link href="/fun" className="btn btn-ghost btn-sm mt-3">Ya Fun Zone mein jao →</Link>
        </TiltCard>
        <TiltCard className="p-5">
          <h3 className="font-display font-bold">🏆 Leaderboard</h3>
          <p className="mt-2 text-sm text-muted">Apna XP barhao aur Pakistan-wide leaderboard par jagah banao.</p>
          <Link href="/leaderboard" className="btn btn-ghost btn-sm mt-3">Leaderboard dekho →</Link>
        </TiltCard>
      </div>
    </div>
  );
}
