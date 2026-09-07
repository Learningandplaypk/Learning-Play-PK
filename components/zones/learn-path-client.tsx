"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock, Play } from "lucide-react";
import { Card, Chip, Progress, Sheet } from "@/components/ui";
import { LEARN_GAME_DATA } from "@/lib/games-data";
import { langFlag, langLabel } from "@/lib/lang-paths";
import { usePlayer } from "@/lib/store";
import { fmt } from "@/lib/utils";
import { ZoneArt, Ustad } from "@/components/brand/ustad";

type NodeState = "done" | "available" | "locked";

export function LearnPathClient({ lang }: { lang: string }) {
  const label = langLabel(lang)!;
  const flag = langFlag(lang);
  const games = useMemo(() => LEARN_GAME_DATA.filter((g) => !g.langs || g.langs.includes(lang)), [lang]);

  const wordsLearned = usePlayer((s) => s.wordsLearned.length);
  const xp = usePlayer((s) => s.xp);
  const results = usePlayer((s) => s.results);
  const [open, setOpen] = useState<number | null>(null);

  const plays = useMemo(() => {
    const m = new Map<string, number>();
    results.forEach((r) => m.set(r.slug, (m.get(r.slug) ?? 0) + 1));
    return m;
  }, [results]);

  // sequential path: a lesson opens once the one before it has been played once
  const states = useMemo(() => {
    const out: NodeState[] = [];
    let blocked = false;
    games.forEach((g) => {
      const done = (plays.get(g.slug) ?? 0) > 0;
      if (done) out.push("done");
      else if (!blocked) {
        out.push("available");
        blocked = true;
      } else out.push("locked");
    });
    return out;
  }, [games, plays]);

  const firstOpen = states.indexOf("available");
  const doneCount = states.filter((s) => s === "done").length;
  const progress = games.length ? (doneCount / games.length) * 100 : 0;
  const active = open != null ? games[open] : null;
  const activeState = open != null ? states[open] : "locked";

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      {/* header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint text-2xl">
            {flag}
          </span>
          <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">{label} seekho</h1>
          <p className="mt-2 text-sm text-muted">
            <span className="tnum">{fmt(xp)}</span> XP · <span className="tnum">{fmt(wordsLearned)}</span> words
            explored · {doneCount}/{games.length} lessons
          </p>
        </div>
        <div className="w-full max-w-xs">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>Course progress</span>
            <span className="tnum">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} label={`Path progress: ${Math.round(progress)}%`} />
        </div>
      </div>

      {/* path */}
      <ol className="relative mx-auto max-w-md">
        <span className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-[var(--border)] sm:left-[39px]" aria-hidden />
        {games.map((g, i) => {
          const state = states[i];
          const count = plays.get(g.slug) ?? 0;
          return (
            <li key={g.slug} className="relative pb-4 last:pb-0">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`${g.title} — ${state}`}
                className="flex w-full items-center gap-4 text-left"
              >
                <span
                  className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 transition-transform active:scale-95 sm:h-20 sm:w-20"
                  style={{
                    background:
                      state === "done" ? "var(--brand-solid)" : state === "available" ? "var(--surface)" : "var(--surface-2)",
                    borderColor:
                      state === "done"
                        ? "var(--brand-solid)"
                        : state === "available"
                          ? "var(--brand)"
                          : "var(--border)",
                    color: state === "done" ? "#fff" : state === "available" ? "var(--brand-ink)" : "var(--muted)",
                    boxShadow: state === "available" ? "0 4px 0 0 var(--brand-edge)" : "none",
                  }}
                >
                  {state === "done" ? (
                    <Check size={26} strokeWidth={3} />
                  ) : state === "available" ? (
                    <Play size={24} strokeWidth={2.6} />
                  ) : (
                    <Lock size={20} strokeWidth={2.4} />
                  )}
                  {count > 1 && (
                    <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-surface bg-accent text-[11px] font-extrabold text-[#4a2f00] tnum">
                      {Math.min(9, count)}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3">
                  <span className="block font-display text-base font-extrabold text-fg">
                    {i + 1}. {g.title}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{g.desc}</span>
                  <span className="mt-2 flex items-center gap-2">
                    {state === "done" ? (
                      <Chip tone="brand">Complete</Chip>
                    ) : state === "available" ? (
                      <Chip tone="accent">Aaj ka lesson</Chip>
                    ) : (
                      <Chip>Locked</Chip>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* side cards */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Card className="flex items-start gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-brand-tint">
            <ZoneArt zone="learn" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-sm font-extrabold text-fg">Roz ka target</h2>
            <p className="mt-1 text-sm text-muted">
              Roz 1 lesson khelo — free plan mein 3 lessons hain. Streak jalao aur daily chest kholo.
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-accent-tint text-accent-ink">
            <Ustad mood="happy" className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-display text-sm font-extrabold text-fg">Leaderboard</h2>
            <p className="mt-1 text-sm text-muted">Apna XP barhao aur Pakistan-wide leaderboard par jagah banao.</p>
            <Link href="/leaderboard" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-ink">
              Leaderboard dekho <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
          </div>
        </Card>
      </div>

      {/* lesson sheet */}
      <Sheet
        open={open != null}
        onClose={() => setOpen(null)}
        title={active ? `${(open ?? 0) + 1}. ${active.title}` : ""}
        footer={
          active ? (
            activeState === "locked" ? (
              <Link
                href={`/learn/${lang}/${games[firstOpen >= 0 ? firstOpen : 0].slug}`}
                className="btn btn-primary btn-block"
              >
                Pehle lesson {firstOpen + 1} khelo
              </Link>
            ) : (
              <Link href={`/learn/${lang}/${active.slug}`} className="btn btn-primary btn-block">
                {activeState === "done" ? "Dobara khelo" : "Lesson shuru karo"}
              </Link>
            )
          ) : null
        }
      >
        {active && (
          <>
            <p className="text-sm leading-relaxed text-muted">{active.desc}</p>
            <ul className="mt-4 space-y-2">
              {active.howTo.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-fg">
                  <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-brand-ink" />
                  {h}
                </li>
              ))}
            </ul>
            {activeState === "locked" && (
              <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                Yeh lesson tab khulega jab aap pehle wala lesson khel loge.
              </p>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}
