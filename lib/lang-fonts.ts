"use client";

/**
 * Per-script webfonts — self-hosted, lazily injected.
 *
 * The woff2 files are copied to public/fonts/ by scripts/copy-script-fonts.mjs
 * (prebuild / predev) straight out of node_modules, exactly like the Urdu face
 * was before. We ship the *script-block subsets* published by Fontsource
 * (arabic / devanagari / bengali), and the @font-face rule for a script is only
 * injected when a lesson screen for that script mounts — so a learner browsing
 * German never downloads Devanagari.
 */

import { useEffect } from "react";
import type { FontKey } from "./lang-registry";

export const FONT_FAMILIES: Record<FontKey, string> = {
  nastaliq: "Noto Nastaliq Urdu Variable",
  naskh: "Noto Naskh Arabic Variable",
  devanagari: "Noto Sans Devanagari Variable",
  bengali: "Noto Sans Bengali Variable",
};

/** File names produced by scripts/copy-script-fonts.mjs. */
export const FONT_FILES: Record<FontKey, string[]> = {
  nastaliq: [
    "noto-nastaliq-urdu-arabic-wght-normal.woff2",
    "noto-nastaliq-urdu-latin-wght-normal.woff2",
  ],
  naskh: ["noto-naskh-arabic-arabic-wght-normal.woff2", "noto-naskh-arabic-latin-wght-normal.woff2"],
  devanagari: [
    "noto-sans-devanagari-devanagari-wght-normal.woff2",
    "noto-sans-devanagari-latin-wght-normal.woff2",
  ],
  bengali: ["noto-sans-bengali-bengali-wght-normal.woff2", "noto-sans-bengali-latin-wght-normal.woff2"],
};

const UNICODE_RANGES: Record<FontKey, string> = {
  nastaliq:
    "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB",
  naskh:
    "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC",
  devanagari:
    "U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF",
  bengali: "U+0980-09FF,U+1CD0-1CD2,U+200C-200D,U+20B9,U+25CC,U+A8F1-A8FD",
};

const LATIN_RANGE =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

export function fontCss(key: FontKey): string {
  const family = FONT_FAMILIES[key];
  const faces: string[] = [];
  const [script, latin] = FONT_FILES[key];
  faces.push(
    `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:100 900;src:url('/fonts/${script}') format('woff2');unicode-range:${UNICODE_RANGES[key]};}`
  );
  if (latin) {
    faces.push(
      `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:100 900;src:url('/fonts/${latin}') format('woff2');unicode-range:${LATIN_RANGE};}`
    );
  }
  return faces.join("");
}

const injected = new Set<string>();

/** Inject the @font-face rules for a script once (idempotent, client-only). */
export function ensureLangFont(key: FontKey | undefined): void {
  if (!key || typeof document === "undefined" || injected.has(key)) return;
  const id = `lang-font-${key}`;
  if (document.getElementById(id)) {
    injected.add(key);
    return;
  }
  const style = document.createElement("style");
  style.id = id;
  style.textContent = fontCss(key);
  document.head.appendChild(style);
  injected.add(key);
}

/** Hook form for lesson screens: pulls the font in when the screen mounts. */
export function useLangFont(key: FontKey | undefined): string | undefined {
  useEffect(() => {
    ensureLangFont(key);
  }, [key]);
  return key ? FONT_FAMILIES[key] : undefined;
}
