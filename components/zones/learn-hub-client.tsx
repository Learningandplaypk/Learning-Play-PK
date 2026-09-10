"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MoreVertical, Plus, Trash2, X } from "lucide-react";
import { Card, Chip, Progress, SectionHeading } from "@/components/ui";
import { ZoneArt } from "@/components/brand/ustad";
import { LangTile } from "@/components/brand/lang-tile";
import { LANG_REGISTRY } from "@/lib/lang-registry";
import { displayLearningLanguages, langStat } from "@/lib/lang-progress";
import { usePlayer } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/utils";
import { AdSlot } from "@/components/ads";

const GAMES_PER_LANG = 8;

/**
 * Learn hub = "My languages". Only the languages the learner picked are shown;
 * everything else lives behind the full-screen picker at /learn/add.
 * Removing a language keeps its progress (langProgress is never deleted).
 */
export function LearnHubClient() {
  const { t } = useI18n();
  const learningLanguages = usePlayer((s) => s.learningLanguages);
  const langProgress = usePlayer((s) => s.langProgress);
  const removeLearningLanguage = usePlayer((s) => s.removeLearningLanguage);
  const toast = usePlayer((s) => s.toast);

  const mine = displayLearningLanguages(learningLanguages, LANG_REGISTRY);
  const [menu, setMenu] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = useCallback((slug: string) => {
    pressTimer.current = setTimeout(() => setMenu(slug), 520);
  }, []);
  const cancelPress = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }, []);

  const remove = (slug: string) => {
    removeLearningLanguage(slug);
    setMenu(null);
    setConfirming(null);
    void import("@/lib/sync")
      .then((m) => m.pushLanguagePrefs())
      .catch(() => {});
    toast("🗑️", `${slug} hata diya`, t("learn.keepProgress"));
  };

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <div className="mb-8">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint">
          <ZoneArt zone="learn" className="h-8 w-8" />
        </span>
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">{t("learn.title")}</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">{t("learn.sub")}</p>
      </div>

      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold text-fg">{t("learn.myLangs")}</h2>
        <span className="text-xs font-semibold text-muted tnum">
          {mine.length}/{LANG_REGISTRY.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mine.map((meta) => {
          const stat = langStat(langProgress, meta.slug);
          const progress = Math.min(100, (stat.plays / GAMES_PER_LANG) * 100);
          const menuOpen = menu === meta.slug;
          return (
            <div
              key={meta.slug}
              className="relative"
              onPointerDown={() => startPress(meta.slug)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu(meta.slug);
              }}
            >
              <Link
                href={`/learn/${meta.slug}`}
                className="group block h-full"
                aria-label={`${t("learn.open")}: ${meta.name}`}
              >
                <Card className="flex h-full flex-col p-4 transition-colors group-hover:border-brand sm:p-5">
                  <span className="mb-3 flex items-center justify-between gap-2">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-tint">
                      <LangTile meta={meta} size={32} />
                    </span>
                    <Chip tone={stat.plays > 0 ? "brand" : "neutral"}>
                      {t("learn.levelShort")} {stat.level}
                    </Chip>
                  </span>

                  <h3 className="font-display text-lg font-extrabold text-fg">{meta.name}</h3>
                  <p
                    className="mt-0.5 text-sm text-brand-ink"
                    {...(meta.rtl ? { dir: "rtl" } : {})}
                  >
                    {meta.native}
                    <span className="ms-2 text-xs text-muted" dir="rtl">
                      {meta.nameUr}
                    </span>
                  </p>

                  <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted">{meta.tagline}</p>

                  <div className="mt-3">
                    <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-muted">
                      <span>
                        <span className="tnum">{fmt(stat.xp)}</span> {t("learn.xpShort")} ·{" "}
                        <span className="tnum">{fmt(stat.words)}</span> {t("learn.wordsShort")}
                      </span>
                      <span className="tnum">
                        {stat.plays}/{GAMES_PER_LANG} {t("learn.lessonsShort")}
                      </span>
                    </div>
                    <Progress value={progress} label={`${meta.name}: ${Math.round(progress)}%`} />
                  </div>

                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-ink">
                    {t("learn.open")} <ArrowRight size={13} strokeWidth={2.6} />
                  </span>
                </Card>
              </Link>

              <button
                type="button"
                onClick={() => setMenu(menuOpen ? null : meta.slug)}
                aria-label={`${t("picker.manage")} ${meta.name}`}
                aria-expanded={menuOpen}
                className="absolute end-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
              >
                <MoreVertical size={16} strokeWidth={2.4} />
              </button>

              {menuOpen && (
                <div className="absolute end-2 top-12 z-20 w-56 rounded-xl border border-line bg-surface p-2 shadow-lg">
                  {confirming === meta.slug ? (
                    <div className="p-1">
                      <p className="text-sm font-extrabold text-fg">{t("learn.removeQ")}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{t("learn.keepProgress")}</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="btn btn-danger btn-sm flex-1" onClick={() => remove(meta.slug)}>
                          <Trash2 size={14} strokeWidth={2.4} /> {t("common.remove")}
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirming(null)}>
                          <X size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href={`/learn/${meta.slug}`} className="btn btn-secondary btn-sm btn-block">
                        {t("learn.open")}
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-block mt-1.5 text-danger"
                        onClick={() => setConfirming(meta.slug)}
                      >
                        <Trash2 size={14} strokeWidth={2.4} /> {t("common.remove")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* add tile */}
        <Link href="/learn/add" className="group block h-full" data-testid="add-language-tile">
          <Card className="flex h-full min-h-[190px] flex-col items-center justify-center gap-3 border-dashed p-5 text-center transition-colors group-hover:border-brand">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-tint text-brand-ink">
              <Plus size={22} strokeWidth={3} />
            </span>
            <span className="font-display text-base font-extrabold text-fg">{t("learn.add")}</span>
            <span className="text-xs text-muted">{LANG_REGISTRY.length - mine.length} more available</span>
          </Card>
        </Link>
      </div>

      {menu && (
        <button
          type="button"
          aria-label={t("common.close")}
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => {
            setMenu(null);
            setConfirming(null);
          }}
        />
      )}

      <div className="mt-14">
        <SectionHeading
          title="Khel kar seekho — seriously"
          sub="Har lesson 3-5 minute ka hai. XP kamao, streak rakho, words yaad rakho."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { n: "1", t: "Language chuno", d: "Apni pasand ki zubanein hub mein add karo — koi limit nahi, sab free." },
            { n: "2", t: "Games khelo", d: "Word Builder, Vocab Battle, Listening, Pronunciation — har game XP deta hai." },
            { n: "3", t: "Streak rakho", d: "Roz thora thora — 30 din mein results dekho. Daily rewards bhi milte hain." },
          ].map((s) => (
            <Card key={s.n} className="p-5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand-tint font-display text-base font-extrabold text-brand-ink">
                {s.n}
              </span>
              <h3 className="mt-3 font-display text-base font-extrabold text-fg">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </Card>
          ))}
        </div>
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEARN || undefined} className="mx-auto mt-12 max-w-2xl" />
    </div>
  );
}
