"use client";

import React, { useEffect, useState } from "react";
import type { GameResult } from "@/components/game-shell";
import { cachedPack, loadPack } from "@/lib/lang-pack";
import type { LangPack } from "@/lib/lang-pack-types";
import { TTS_UNAVAILABLE, useTts } from "@/lib/tts";
import { getLangMeta } from "@/lib/lang-registry";
import { useI18n } from "@/lib/i18n";
import { useLangFont } from "@/lib/lang-fonts";

/**
 * Lesson-data plumbing shared by every learn-zone engine:
 *  - `useLangPack` pulls the language's JSON chunk on demand (and memoises it)
 *  - `LessonLoading` / `LessonEmpty` keep the engines free of render-time side
 *    effects when the pack hasn't arrived (or is genuinely empty)
 *  - `TtsNote` surfaces the "Audio is device-dependent" fallback
 */

export function useLangPack(slug: string): LangPack | null {
  const [pack, setPack] = useState<LangPack | null>(() => cachedPack(slug) ?? null);
  useEffect(() => {
    const hit = cachedPack(slug);
    if (hit) {
      setPack(hit);
      return;
    }
    let alive = true;
    void loadPack(slug).then((p) => {
      if (alive) setPack(p);
    });
    return () => {
      alive = false;
    };
  }, [slug]);
  return pack;
}

export function LessonLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-[var(--brand)]" aria-hidden />
      <p className="text-sm font-semibold text-muted">Lesson data load ho raha hai…</p>
    </div>
  );
}

/** Ends the round cleanly (no render-time onEnd) when a pack has nothing to play. */
export function LessonEmpty({ onEnd, slug }: { onEnd: (r: GameResult) => void; slug: string }) {
  useEffect(() => {
    onEnd({ score: 0, maxScore: 1, accuracy: 0, timeMs: 0 });
  }, [onEnd]);
  return (
    <p className="p-10 text-center text-muted">
      {slug} ke liye abhi yeh lesson ka content load nahi hua. Wapas koshish karein.
    </p>
  );
}

/**
 * TTS status line for listening / pronunciation games. Rendered inline so a
 * missing device voice never looks like a broken game.
 */
export function TtsNote({ codes }: { codes: string[] }) {
  const { t } = useI18n();
  const { supported, matched, generic } = useTts(codes);
  if (supported && !generic) return null;
  return (
    <p
      role="note"
      className="mb-3 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted"
    >
      <strong className="font-extrabold text-fg">{t("tts.note")}.</strong> {t("tts.noteBody")}
      {!supported && <span className="block mt-0.5">codes: {codes.join(", ")}</span>}
      {supported && matched === null && <span className="block mt-0.5">default voice use ho rahi hai</span>}
    </p>
  );
}

/** Script font + direction for a lesson screen (lesson screens only). */
export function useLessonScript(slug: string) {
  const meta = getLangMeta(slug);
  const family = useLangFont(meta?.font);
  return { meta, rtl: !!meta?.rtl, family };
}
