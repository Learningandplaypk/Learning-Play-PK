"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Play, Plus } from "lucide-react";
import { Card, Chip, Progress, Sheet } from "@/components/ui";
import { LEARN_GAME_DATA } from "@/lib/games-data";
import { getLangMeta } from "@/lib/lang-paths";
import { langStat } from "@/lib/lang-progress";
import { usePlayer } from "@/lib/store";
import { fmt } from "@/lib/utils";
import { ZoneArt, Ustad } from "@/components/brand/ustad";
import { LangTile } from "@/components/brand/lang-tile";
import { useLessonScript } from "@/components/games/learn/lesson-bits";
import { loadPack } from "@/lib/lang-pack";
import type { PackAlphabet } from "@/lib/lang-pack-types";

/**
 * Path node states. There is NO "locked" state — every lesson is playable from
 * day one. "next" is only a suggestion of where to continue.
 */
type NodeState = "done" | "next" | "todo";

export function LearnPathClient({ lang }: { lang: string }) {
  const meta = getLangMeta(lang);
  const label = meta?.name ?? lang;
  const games = useMemo(() => LEARN_GAME_DATA.filter((g) => !g.langs || g.langs.includes(lang)), [lang]);

  const learningLanguages = usePlayer((s) => s.learningLanguages);
  const langProgress = usePlayer((s) => s.langProgress);
  const addLearningLanguage = usePlayer((s) => s.addLearningLanguage);
  const results = usePlayer((s) => s.results);
  const [open, setOpen] = useState<number | null>(null);
  const [primer, setPrimer] = useState(false);

  // The script primer is the only part of this page that needs the language's
  // JSON chunk, so it is fetched when the learner opens it (no hook branching).
  const [alphabet, setAlphabet] = useState<PackAlphabet | null>(null);
  useEffect(() => {
    if (!primer || alphabet) return;
    let alive = true;
    void loadPack(lang).then((p) => {
      if (alive) setAlphabet(p?.alphabet ?? null);
    });
    return () => {
      alive = false;
    };
  }, [primer, alphabet, lang]);
  const { family } = useLessonScript(lang);
  const stat = langStat(langProgress, lang);
  const inHub = learningLanguages.includes(lang);

  const plays = useMemo(() => {
    const m = new Map<string, number>();
    results.forEach((r) => m.set(r.slug, (m.get(r.slug) ?? 0) + 1));
    return m;
  }, [results]);

  // no gating: every lesson is open. The first unplayed one is just "suggested next".
  const states = useMemo(() => {
    let suggested = false;
    return games.map<NodeState>((g) => {
      if ((plays.get(g.slug) ?? 0) > 0) return "done";
      if (!suggested) {
        suggested = true;
        return "next";
      }
      return "todo";
    });
  }, [games, plays]);
  const doneCount = states.filter((s) => s === "done").length;
  const progress = games.length ? (doneCount / games.length) * 100 : 0;
  const active = open != null ? games[open] : null;
  const activeState: NodeState = open != null ? states[open] : "todo";

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      {/* header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint">
            {meta ? <LangTile meta={meta} size={38} /> : null}
          </span>
          <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">{label} seekho</h1>
          {meta && (
            <p
              className="mt-1 text-sm text-brand-ink"
              {...(meta.rtl ? { dir: "rtl" } : {})}
              style={family ? { fontFamily: family } : undefined}
            >
              {meta.native}
            </p>
          )}
          <p className="mt-2 text-sm text-muted">
            <span className="tnum">{fmt(stat.xp)}</span> XP · <span className="tnum">{fmt(stat.words)}</span> words ·{" "}
            {doneCount}/{games.length} lessons
          </p>
          {!inHub && (
            <button
              type="button"
              className="btn btn-secondary btn-sm mt-3"
              onClick={() => {
                addLearningLanguage(lang);
                void import("@/lib/sync").then((m) => m.pushLanguagePrefs()).catch(() => {});
              }}
            >
              <Plus size={15} strokeWidth={2.6} /> My languages mein add karo
            </button>
          )}
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
        <span className="absolute start-[31px] top-6 bottom-6 w-0.5 bg-[var(--border)] sm:start-[39px]" aria-hidden />
        {games.map((g, i) => {
          const state = states[i];
          const count = plays.get(g.slug) ?? 0;
          return (
            <li key={g.slug} className="relative pb-4 last:pb-0">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`${g.title} — ${state}`}
                className="flex w-full items-center gap-4 text-start"
              >
                <span
                  className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 transition-transform active:scale-95 sm:h-20 sm:w-20"
                  style={{
                    background:
                      state === "done" ? "var(--brand-solid)" : state === "next" ? "var(--surface)" : "var(--surface-2)",
                    borderColor:
                      state === "done"
                        ? "var(--brand-solid)"
                        : state === "next"
                          ? "var(--brand)"
                          : "var(--border)",
                    color: state === "done" ? "#fff" : state === "next" ? "var(--brand-ink)" : "var(--muted)",
                    boxShadow: state === "next" ? "0 4px 0 0 var(--brand-edge)" : "none",
                  }}
                >
                  {state === "next" && <span className="pulse-ring" />}
                  {state === "done" ? (
                    <Check size={26} strokeWidth={3} className="pop-in" />
                  ) : (
                    <Play size={24} strokeWidth={2.6} />
                  )}
                  {state === "done" && (
                    <span className="absolute -top-2 start-1/2 -translate-x-1/2 text-sm pop-in" aria-hidden>
                      👑
                    </span>
                  )}
                  {state === "next" && (
                    <span className="absolute -end-10 top-1/2 hidden w-10 -translate-y-1/2 sm:block" aria-hidden>
                      <Ustad mood="happy" className="h-10 w-10" />
                    </span>
                  )}
                  {count > 1 && (
                    <span className="absolute -end-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-surface bg-accent text-[11px] font-extrabold text-[#4a2f00] tnum">
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
                    ) : state === "next" ? (
                      <Chip tone="accent">Yahan se shuru karo</Chip>
                    ) : (
                      <Chip>Khula hai</Chip>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* script primer (only languages that have one) */}
      <div className="mx-auto mt-8 max-w-md">
        <Card className="p-4">
          <button type="button" className="flex w-full items-center justify-between gap-3 text-start" onClick={() => setPrimer((v) => !v)}>
            <span>
              <span className="block font-display text-sm font-extrabold text-fg">Script primer</span>
              <span className="mt-0.5 block text-xs text-muted">
                {meta?.rtl ? "RTL script" : "Alphabet"} — letters, romanization aur examples
              </span>
            </span>
            <span className="chip">{primer ? "Band karo" : "Kholo"}</span>
          </button>
          {primer && !alphabet && <p className="mt-3 text-xs text-muted">Load ho raha hai…</p>}
          {primer && alphabet && (
            <div className="mt-3">
              {alphabet.intro && <p className="mb-3 text-xs leading-relaxed text-muted">{alphabet.intro}</p>}
              <div
                className="grid grid-cols-4 gap-2 sm:grid-cols-6"
                dir={meta?.rtl ? "rtl" : "ltr"}
                style={family ? { fontFamily: family } : undefined}
              >
                {alphabet.rows.map((r) => (
                  <span key={`${r.ch}-${r.name}`} className="rounded-lg border border-line bg-surface-2 p-2 text-center">
                    <span className="block text-xl font-bold text-fg">{r.ch}</span>
                    <span className="mt-0.5 block text-[10px] text-muted" style={{ fontFamily: "inherit" }} dir="ltr">
                      {r.r}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* side cards */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Card className="flex items-start gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-brand-tint">
            <ZoneArt zone="learn" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-sm font-extrabold text-fg">Roz ka target</h2>
            <p className="mt-1 text-sm text-muted">
              Roz 1 lesson khelo. Koi daily limit nahi — jitne chaho lessons karo, saare khule hain.
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
            <Link href={`/learn/${lang}/${active.slug}`} className="btn btn-primary btn-block">
              {activeState === "done" ? "Dobara khelo" : "Lesson shuru karo"}
            </Link>
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
          </>
        )}
      </Sheet>
    </div>
  );
}
