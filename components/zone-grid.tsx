"use client";

import React from "react";
import Link from "next/link";
import { TiltCard } from "./ui";
import type { GameData } from "@/lib/games-data";
import { useI18n } from "@/lib/i18n";

/** Bento grid used by /brain /fun /quiz and the learn path page. */
export function ZoneGrid({ games, basePath }: { games: GameData[]; basePath: string }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {games.map((g) => (
        <TiltCard key={g.slug} className="group flex flex-col p-4 sm:p-5">
          <Link href={`${basePath}/${g.slug}`} className="flex h-full flex-col" aria-label={`${g.title} khelo`}>
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-electric/25 via-neon-purple/20 to-neon-green/20 text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_14px_rgba(57,255,20,.6)]">
              {g.emoji}
            </div>
            <h3 className="font-display text-[15px] font-bold leading-tight sm:text-base">{g.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{g.desc}</p>
            <span className="mt-auto pt-3 text-xs font-bold text-neon-green opacity-0 transition-opacity group-hover:opacity-100">
              {t("cta.play")} →
            </span>
          </Link>
        </TiltCard>
      ))}
    </div>
  );
}

export function ZoneHeader({ emoji, title, urdu, desc }: { emoji: string; title: string; urdu: string; desc: string }) {
  return (
    <div className="mb-10 text-center">
      <div className="mx-auto mb-4 grid h-20 w-20 animate-float place-items-center rounded-3xl bg-gradient-to-br from-electric/30 via-neon-purple/25 to-neon-green/25 text-4xl shadow-[0_0_50px_-10px_rgba(45,124,255,.7)]">{emoji}</div>
      <h1 className="font-display text-3xl font-black sm:text-5xl">
        <span className="text-gradient">{title}</span>
      </h1>
      <p className="urdu mt-1 text-sm text-neon-green">{urdu}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{desc}</p>
    </div>
  );
}
