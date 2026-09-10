"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { Ustad } from "@/components/brand/ustad";
import { LangTile } from "@/components/brand/lang-tile";
import { LANG_REGISTRY } from "@/lib/lang-registry";
import { useI18n, UI_LANGS } from "@/lib/i18n";
import { usePlayer, type LangKey } from "@/lib/store";

/**
 * First-visit onboarding — one screen, skippable, shown exactly once.
 *
 *  1. Pick the app language (English / Roman Urdu / اردو). English is the
 *     default and the browser language is never sniffed.
 *  2. Pick the languages you want to learn (English pre-selected).
 *
 * Answering (or skipping) sets `onboarded`, which is persisted in the player
 * store and mirrored to users/{uid}, so the sheet never comes back.
 */
export function OnboardingSheet() {
  const hydrated = usePlayer((s) => s.hydrated);
  const onboarded = usePlayer((s) => s.onboarded);
  const setPlayer = usePlayer((s) => s.setPlayer);
  const setLearningLanguages = usePlayer((s) => s.setLearningLanguages);
  const { t, lang, setLang } = useI18n();

  const [uiLang, setUiLang] = useState<LangKey>(lang);
  const [picked, setPicked] = useState<string[]>(["english"]);

  if (!hydrated || onboarded) return null;

  const toggle = (slug: string) => {
    setPicked((prev) => {
      if (prev.includes(slug)) {
        // English is the floor so the hub is never empty
        const next = prev.filter((s) => s !== slug);
        return next.length ? next : ["english"];
      }
      return [...prev, slug];
    });
  };

  const finish = (skipped: boolean) => {
    if (!skipped) {
      setLang(uiLang);
      setLearningLanguages(picked);
    }
    setPlayer({ onboarded: true });
    void import("@/lib/sync")
      .then((m) => m.pushLanguagePrefs())
      .catch(() => {});
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.title")}
      data-testid="onboarding"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[rgba(18,18,16,0.55)] p-4 backdrop-blur-[2px]"
    >
      <div className="mx-auto my-6 max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <Ustad mood="happy" className="h-12 w-12 shrink-0" />
          <div>
            <h2 className="font-display text-xl font-black text-fg sm:text-2xl">{t("onboarding.title")}</h2>
            <p className="mt-0.5 text-sm text-muted">{t("onboarding.sub")}</p>
          </div>
        </div>

        {/* 1 — app language */}
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{t("onboarding.appLang")}</p>
        <div className="flex flex-wrap gap-2">
          {UI_LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setUiLang(l.key)}
              aria-pressed={uiLang === l.key}
              className="filter-chip"
              style={
                uiLang === l.key
                  ? { background: "var(--brand-tint)", borderColor: "var(--brand)", color: "var(--brand-ink)" }
                  : undefined
              }
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* 2 — learning languages */}
        <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-muted">{t("onboarding.learnLangs")}</p>
        <p className="mb-3 text-xs text-muted">{t("onboarding.learnHint")}</p>
        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pe-1 sm:grid-cols-3">
          {LANG_REGISTRY.map((meta) => {
            const on = picked.includes(meta.slug);
            return (
              <button
                key={meta.slug}
                type="button"
                onClick={() => toggle(meta.slug)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-start transition ${
                  on ? "border-brand bg-brand-tint" : "border-line bg-surface-2"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center">
                  <LangTile meta={meta} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-extrabold text-fg">{meta.name}</span>
                  <span className="block truncate text-[10px] text-muted" {...(meta.rtl ? { dir: "rtl" } : {})}>
                    {meta.native}
                  </span>
                </span>
                {on && <Check size={14} strokeWidth={3} className="shrink-0 text-brand-ink" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" block className="flex-1" onClick={() => finish(false)}>
            {t("onboarding.start")}
          </Button>
          <Button size="lg" variant="secondary" block onClick={() => finish(true)}>
            {t("onboarding.skip")}
          </Button>
        </div>
      </div>
    </div>
  );
}
