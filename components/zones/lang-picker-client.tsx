"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui";
import { LangTile } from "@/components/brand/lang-tile";
import { GROUP_LABELS, GROUP_ORDER, LANG_REGISTRY, type LangGroup, type LangMeta } from "@/lib/lang-registry";
import { displayLearningLanguages } from "@/lib/lang-progress";
import { usePlayer } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/utils";

export type LangCounts = Record<string, { words: number; phrases: number; grammar: number; sentences: number }>;

/**
 * Full-screen "Add a language" picker: search + the five groups from the
 * registry. Adding is instant and unlimited; progress for a removed language is
 * kept, so re-adding picks up where the learner left off.
 */
export function LangPickerClient({ counts }: { counts: LangCounts }) {
  const { t } = useI18n();
  const learningLanguages = usePlayer((s) => s.learningLanguages);
  const addLearningLanguage = usePlayer((s) => s.addLearningLanguage);
  const langProgress = usePlayer((s) => s.langProgress);
  const toast = usePlayer((s) => s.toast);
  const [q, setQ] = useState("");

  const mine = useMemo(() => new Set(displayLearningLanguages(learningLanguages).map((l) => l.slug)), [learningLanguages]);

  const matches = (meta: LangMeta) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [meta.name, meta.native, meta.nameUr, meta.slug, meta.tagline]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  };

  const groups = useMemo(() => {
    const out: Array<{ group: LangGroup; langs: LangMeta[] }> = [];
    for (const group of GROUP_ORDER) {
      const langs = LANG_REGISTRY.filter((l) => (group === "popular" ? l.popular : l.group === group) && matches(l));
      if (langs.length) out.push({ group, langs });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const add = (meta: LangMeta) => {
    addLearningLanguage(meta.slug);
    toast("✅", `${meta.name} ${t("picker.addedToast")}`, `${meta.native}`);
    void import("@/lib/sync")
      .then((m) => m.pushLanguagePrefs())
      .catch(() => {});
  };

  const total = groups.reduce((n, g) => n + g.langs.length, 0);

  return (
    <div className="container-page page-pad pb-24 pt-6 md:pb-10">
      <div className="mb-6 flex items-start gap-3">
        <Link href="/learn" className="btn btn-secondary btn-sm shrink-0" aria-label="Back to Learn">
          <ArrowLeft size={16} strokeWidth={2.4} />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black text-fg sm:text-3xl">{t("picker.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("picker.sub")}</p>
        </div>
      </div>

      <label className="relative mb-6 block">
        <Search size={16} strokeWidth={2.4} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("picker.search")}
          aria-label={t("picker.search")}
          className="field ps-10"
        />
      </label>

      {total === 0 && <p className="rounded-xl border border-line bg-surface-2 p-6 text-center text-sm text-muted">{t("picker.noResults")}</p>}

      {groups.map(({ group, langs }) => (
        <section key={group} className="mb-8">
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wider text-muted">
            {GROUP_LABELS[group]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {langs.map((meta) => {
              const c = counts[meta.slug];
              const added = mine.has(meta.slug);
              const xp = langProgress[meta.slug]?.xp ?? 0;
              return (
                <Card key={meta.slug} className="flex items-center gap-3 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2">
                    <LangTile meta={meta} size={32} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-extrabold text-fg">{meta.name}</p>
                    <p className="truncate text-xs text-brand-ink" {...(meta.rtl ? { dir: "rtl" } : {})}>
                      {meta.native}
                      <span className="ms-2 text-muted" dir="rtl">
                        {meta.nameUr}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted tnum">
                      {c ? `${fmt(c.words)} words · ${fmt(c.phrases)} phrases` : meta.tagline}
                      {xp > 0 ? ` · ${fmt(xp)} XP` : ""}
                    </p>
                  </div>
                  {added ? (
                    <Link href={`/learn/${meta.slug}`} className="btn btn-secondary btn-sm shrink-0">
                      <Check size={15} strokeWidth={2.6} /> {t("picker.added")}
                    </Link>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => add(meta)}>
                      <Plus size={15} strokeWidth={2.6} /> {t("picker.add")}
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
