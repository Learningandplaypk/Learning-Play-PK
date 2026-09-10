"use client";

/**
 * Web Speech TTS with graceful degradation.
 *
 * Every language ships an ordered list of BCP-47 codes (see LANG_REGISTRY.tts):
 * the primary code, then fallbacks that are close enough to be intelligible
 * (ms-MY → id-ID, pa-IN / sd-PK / bal → ur-PK, …). Browsers expose wildly
 * different voice inventories, so nothing here throws: when no voice matches we
 * report `supported: false` and the UI shows "Audio is device-dependent"
 * instead of a broken speaker button.
 */

import { useCallback, useEffect, useState } from "react";

export type TtsStatus = {
  /** True when at least one voice (even a fallback) can speak this language. */
  supported: boolean;
  /** The BCP-47 code that actually matched, or null. */
  matched: string | null;
  /** True when we had to fall back to the browser's default voice. */
  generic: boolean;
};

export const TTS_UNAVAILABLE = "Audio is device-dependent — aap ke phone/browser mein is zubaan ki voice nahi hai.";

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return null;
  return window.speechSynthesis;
}

export function availableVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  try {
    return s.getVoices();
  } catch {
    return [];
  }
}

/**
 * Pure voice chooser — given the ordered BCP-47 codes a language wants and the
 * list of language tags the device actually has, returns the tag to use (or
 * null when nothing matches and we must fall back to the default voice).
 * Exported so the fallback chain is unit-testable without a browser.
 */
export function chooseTtsLang(codes: string[], available: string[]): string | null {
  const have = available.map((a) => (a || "").toLowerCase());
  for (const code of codes) {
    const c = code.toLowerCase();
    const exact = have.find((t) => t === c);
    if (exact) return available[have.indexOf(exact)];
    const base = c.split("-")[0];
    const sibling = have.find((t) => t.startsWith(`${base}-`));
    if (sibling) return available[have.indexOf(sibling)];
  }
  return null;
}

/** Exact tag → language prefix → script/region sibling, in that order. */
function rankVoice(v: SpeechSynthesisVoice, code: string): number {
  const c = code.toLowerCase();
  const tag = (v.lang || "").toLowerCase();
  if (tag === c) return 3;
  if (tag.startsWith(`${c.split("-")[0]}-`)) return 2;
  return 0;
}

export function pickVoice(codes: string[]): { voice: SpeechSynthesisVoice | null; matched: string | null } {
  const voices = availableVoices();
  if (!voices.length) return { voice: null, matched: null };
  const chosen = chooseTtsLang(codes, voices.map((v) => v.lang));
  if (chosen) {
    const v = voices.find((x) => x.lang === chosen);
    if (v) return { voice: v, matched: chosen };
  }
  for (const code of codes) {
    let best: SpeechSynthesisVoice | null = null;
    let bestRank = 0;
    for (const v of voices) {
      const r = rankVoice(v, code);
      if (r > bestRank) {
        bestRank = r;
        best = v;
      }
      if (bestRank === 3) break;
    }
    if (best && bestRank >= 2) return { voice: best, matched: code };
  }
  // last resort: the browser default, flagged as generic so the UI can warn.
  const fallback = voices.find((v) => v.default) ?? voices[0];
  return { voice: fallback ?? null, matched: null };
}

export function ttsStatus(codes: string[]): TtsStatus {
  const { voice, matched } = pickVoice(codes);
  return { supported: !!voice, matched, generic: !matched };
}

export type SpeakOptions = { rate?: number; pitch?: number; onEnd?: () => void };

/**
 * Speak `text` using the best available voice for `codes`.
 * Returns false when the device has no speech synthesis at all.
 */
export function speak(text: string, codes: string[], opts: SpeakOptions = {}): boolean {
  const s = synth();
  if (!s || !text) return false;
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const { voice, matched } = pickVoice(codes);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang || matched || codes[0];
    } else {
      u.lang = codes[0];
    }
    u.rate = opts.rate ?? 0.85;
    u.pitch = opts.pitch ?? 1;
    if (opts.onEnd) u.onend = () => opts.onEnd?.();
    s.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function cancelSpeech(): void {
  try {
    synth()?.cancel();
  } catch {
    /* nothing to cancel */
  }
}

/**
 * React binding: subscribes to `voiceschanged` (Chrome populates the voice list
 * asynchronously) and exposes a stable `say()` for game components.
 */
export function useTts(codes: string[]) {
  const key = codes.join(",");
  const [status, setStatus] = useState<TtsStatus>(() => ({ supported: false, matched: null, generic: true }));

  useEffect(() => {
    const list = key.split(",").filter(Boolean);
    const refresh = () => setStatus(ttsStatus(list));
    refresh();
    const s = synth();
    if (!s) return;
    s.addEventListener("voiceschanged", refresh);
    // Chrome sometimes fires voiceschanged before we subscribe.
    const t = setTimeout(refresh, 600);
    return () => {
      s.removeEventListener("voiceschanged", refresh);
      clearTimeout(t);
    };
  }, [key]);

  const say = useCallback(
    (text: string, opts?: SpeakOptions) => speak(text, key.split(",").filter(Boolean), opts),
    [key]
  );

  return { ...status, say };
}
