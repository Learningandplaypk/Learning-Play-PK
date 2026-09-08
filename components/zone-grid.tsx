"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardSkeleton, Chip, DifficultyDots, Input } from "@/components/ui";
import type { GameData } from "@/lib/games-data";
import { gameDifficulty } from "@/lib/games-data";
import { ZoneArt, type ZoneKey } from "@/components/brand/ustad";
import { useI18n } from "@/lib/i18n";
import { usePlayer } from "@/lib/store";
import { fmt } from "@/lib/utils";

const DIFF_LABEL: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };

/* ------------------------------ zone header ----------------------------- */

export function ZoneHeader({
  zone,
  title,
  urdu,
  desc,
}: {
  zone: ZoneKey;
  title: string;
  urdu?: string;
  desc: string;
}) {
  return (
    <div className="mb-8">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint">
        <ZoneArt zone={zone} className="h-8 w-8" />
      </span>
      <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">{title}</h1>
      {urdu && <p className="urdu mt-1 text-base text-brand-ink">{urdu}</p>}
      <p className="mt-2 max-w-2xl text-base text-muted">{desc}</p>
    </div>
  );
}

/* -------------------------------- game card ----------------------------- */

export function GameCard({ game, basePath, best }: { game: GameData; basePath: string; best?: number }) {
  const { t } = useI18n();
  const difficulty = gameDifficulty(game.slug);
  return (
    <Card className="card-interactive flex h-full flex-col p-4">
      <span className="card-art mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-tint">
        <ZoneArt zone={game.zone} className="h-7 w-7" />
      </span>
      <h2 className="font-display text-base font-extrabold leading-tight text-fg">{game.title}</h2>
      <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{game.desc}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <DifficultyDots level={difficulty} />
          <span className="text-[11px] text-muted">{DIFF_LABEL[difficulty]}</span>
        </span>
        {best ? (
          <span className="text-[11px] font-semibold text-muted">
            Best <span className="tnum">{fmt(best)}</span>
          </span>
        ) : null}
      </div>
      <Link href={`${basePath}/${game.slug}`} className="btn btn-primary btn-sm btn-play mt-4 w-full">
        {t("cta.play")}
      </Link>
    </Card>
  );
}

/* ------------------------------ catalog grid ---------------------------- */

export function GameCatalog({
  games,
  basePath,
  zone,
  title,
  urdu,
  desc,
  children,
}: {
  games: GameData[];
  basePath: string;
  zone: ZoneKey;
  title: string;
  urdu?: string;
  desc: string;
  children?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const hydrated = usePlayer((s) => s.hydrated);
  const results = usePlayer((s) => s.results);

  const bestBySlug = useMemo(() => {
    const m = new Map<string, number>();
    results.forEach((r) => m.set(r.slug, Math.max(m.get(r.slug) ?? 0, r.score)));
    return m;
  }, [results]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return games.filter((g) => {
      const matchQ = !needle || g.title.toLowerCase().includes(needle) || g.desc.toLowerCase().includes(needle);
      const matchL = level === 0 || gameDifficulty(g.slug) === level;
      return matchQ && matchL;
    });
  }, [games, q, level]);

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <ZoneHeader zone={zone} title={title} urdu={urdu} desc={desc} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={18} strokeWidth={2.2} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Games dhoondo…"
            aria-label="Search games"
            className="ps-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 0 as const, label: "Sab" },
            { id: 1 as const, label: "Easy" },
            { id: 2 as const, label: "Medium" },
            { id: 3 as const, label: "Hard" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className="filter-chip"
              aria-pressed={level === f.id}
              onClick={() => setLevel(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!hydrated ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {games.slice(0, 8).map((g) => (
            <CardSkeleton key={g.slug} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-fg">Koi game nahi mila</p>
          <p className="mt-1 text-sm text-muted">Alfaaz badlo ya filter hatao.</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-4"
            onClick={() => {
              setQ("");
              setLevel(0);
            }}
          >
            Filters clear karo
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {filtered.map((g) => (
            <GameCard key={g.slug} game={g} basePath={basePath} best={bestBySlug.get(g.slug)} />
          ))}
        </div>
      )}

      {children}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Chip>
          {games.length} games · {filtered.length} dikh rahe hain
        </Chip>
        <Chip>Har game free</Chip>
        <Chip>Sab free</Chip>
      </div>
    </div>
  );
}
