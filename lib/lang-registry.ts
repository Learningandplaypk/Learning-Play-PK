/**
 * Learning-language registry — METADATA ONLY (no lesson content).
 *
 * This module is imported by server code (metadata, sitemap) and client code
 * (hub, picker, lesson screens). It must stay tiny: the actual word/phrase/
 * grammar JSON lives in `data/langs/<slug>.json` and is fetched lazily per
 * route by `lib/lang-pack.ts` so no lesson data ever lands in the shared chunk.
 */

export type LangGroup = "popular" | "europe" | "asia" | "mideast" | "pksa";

/** Script family — drives direction, font face and letter-tile styling. */
export type ScriptKey =
  | "latin"
  | "arabic"
  | "nastaliq"
  | "devanagari"
  | "bengali"
  | "cyrillic"
  | "han"
  | "hangul"
  | "kana";

/** Self-hosted, lazily-injected webfont family (see lib/lang-fonts.ts). */
export type FontKey = "nastaliq" | "naskh" | "devanagari" | "bengali";

export type LangTile =
  | { kind: "flag"; cc: string }
  | { kind: "glyph"; text: string }
  | { kind: "globe" };

export type LangMeta = {
  slug: string;
  /** English name shown in the UI. */
  name: string;
  /** Native name, in its own script. */
  native: string;
  /** Urdu name (اردو). */
  nameUr: string;
  group: LangGroup;
  rtl: boolean;
  script: ScriptKey;
  font?: FontKey;
  /** BCP-47 codes tried in order — first supported voice wins. */
  tts: string[];
  tile: LangTile;
  /** Brand-ish accent used on the lesson path header. */
  color: string;
  /** One-line pitch (Roman Urdu) used on hub + picker cards. */
  tagline: string;
  popular?: boolean;
};

export const LANG_REGISTRY: LangMeta[] = [
  {
    slug: "english",
    name: "English",
    native: "English",
    nameUr: "انگریزی",
    group: "popular",
    rtl: false,
    script: "latin",
    tts: ["en-US", "en-GB"],
    tile: { kind: "globe" },
    color: "#178A55",
    tagline: "Full course — 300+ words, grammar, idioms, stories",
    popular: true,
  },
  {
    slug: "urdu",
    name: "Urdu",
    native: "اردو",
    nameUr: "اردو",
    group: "pksa",
    rtl: true,
    script: "nastaliq",
    font: "nastaliq",
    tts: ["ur-PK", "ur-IN", "hi-IN"],
    tile: { kind: "flag", cc: "PK" },
    color: "#0F6B45",
    tagline: "Qaumi zubaan — likhna, parhna aur bolna",
    popular: true,
  },
  {
    slug: "arabic",
    name: "Arabic",
    native: "العربية",
    nameUr: "عربی",
    group: "mideast",
    rtl: true,
    script: "arabic",
    font: "naskh",
    tts: ["ar-SA", "ar-EG"],
    tile: { kind: "flag", cc: "SA" },
    color: "#1F7A4C",
    tagline: "Quranic vocabulary samet",
    popular: true,
  },
  {
    slug: "german",
    name: "German",
    native: "Deutsch",
    nameUr: "جرمن",
    group: "europe",
    rtl: false,
    script: "latin",
    tts: ["de-DE", "de-AT"],
    tile: { kind: "flag", cc: "DE" },
    color: "#C8102E",
    tagline: "Study + work visas ki zubaan",
    popular: true,
  },
  {
    slug: "french",
    name: "French",
    native: "Français",
    nameUr: "فرانسیسی",
    group: "europe",
    rtl: false,
    script: "latin",
    tts: ["fr-FR", "fr-CA"],
    tile: { kind: "flag", cc: "FR" },
    color: "#1F4FA3",
    tagline: "Romance languages ki queen",
  },
  {
    slug: "spanish",
    name: "Spanish",
    native: "Español",
    nameUr: "ہسپانوی",
    group: "europe",
    rtl: false,
    script: "latin",
    tts: ["es-ES", "es-MX"],
    tile: { kind: "flag", cc: "ES" },
    color: "#C60B1E",
    tagline: "Duniya ki 2nd bari zuban",
    popular: true,
  },
  {
    slug: "turkish",
    name: "Turkish",
    native: "Türkçe",
    nameUr: "ترکی",
    group: "europe",
    rtl: false,
    script: "latin",
    tts: ["tr-TR"],
    tile: { kind: "flag", cc: "TR" },
    color: "#B0212C",
    tagline: "Ertugrul wali zuban!",
  },
  {
    slug: "italian",
    name: "Italian",
    native: "Italiano",
    nameUr: "اطالوی",
    group: "europe",
    rtl: false,
    script: "latin",
    tts: ["it-IT"],
    tile: { kind: "flag", cc: "IT" },
    color: "#009246",
    tagline: "Opera, pizza aur design ki zubaan",
  },
  {
    slug: "portuguese",
    name: "Portuguese (Brazil)",
    native: "Português",
    nameUr: "پرتگالی",
    group: "europe",
    rtl: false,
    script: "latin",
    tts: ["pt-BR", "pt-PT"],
    tile: { kind: "flag", cc: "BR" },
    color: "#009B3A",
    tagline: "Brazil aur Portugal — 250M speakers",
  },
  {
    slug: "russian",
    name: "Russian",
    native: "Русский",
    nameUr: "روسی",
    group: "europe",
    rtl: false,
    script: "cyrillic",
    tts: ["ru-RU"],
    tile: { kind: "flag", cc: "RU" },
    color: "#1D4FA1",
    tagline: "Cyrillic script + 260M speakers",
  },
  {
    slug: "chinese",
    name: "Chinese",
    native: "中文",
    nameUr: "چینی",
    group: "asia",
    rtl: false,
    script: "han",
    tts: ["zh-CN", "zh-TW"],
    tile: { kind: "flag", cc: "CN" },
    color: "#D2232A",
    tagline: "Mandarin basics + tones",
  },
  {
    slug: "japanese",
    name: "Japanese",
    native: "日本語",
    nameUr: "جاپانی",
    group: "asia",
    rtl: false,
    script: "kana",
    tts: ["ja-JP"],
    tile: { kind: "flag", cc: "JP" },
    color: "#B22A35",
    tagline: "Anime ke fans ke liye",
  },
  {
    slug: "korean",
    name: "Korean",
    native: "한국어",
    nameUr: "کورین",
    group: "asia",
    rtl: false,
    script: "hangul",
    tts: ["ko-KR"],
    tile: { kind: "flag", cc: "KR" },
    color: "#1B4FA0",
    tagline: "K-drama aur K-pop ke liye",
  },
  {
    slug: "hindi",
    name: "Hindi",
    native: "हिन्दी",
    nameUr: "ہندی",
    group: "asia",
    rtl: false,
    script: "devanagari",
    font: "devanagari",
    tts: ["hi-IN"],
    tile: { kind: "flag", cc: "IN" },
    color: "#E0762A",
    tagline: "Devanagari script ke sath",
    popular: true,
  },
  {
    slug: "bengali",
    name: "Bengali",
    native: "বাংলা",
    nameUr: "بنگالی",
    group: "asia",
    rtl: false,
    script: "bengali",
    font: "bengali",
    tts: ["bn-BD", "bn-IN"],
    tile: { kind: "flag", cc: "BD" },
    color: "#006A4E",
    tagline: "Bangladesh + West Bengal",
  },
  {
    slug: "malay",
    name: "Malay",
    native: "Bahasa Melayu",
    nameUr: "مالائی",
    group: "asia",
    rtl: false,
    script: "latin",
    tts: ["ms-MY", "id-ID"],
    tile: { kind: "flag", cc: "MY" },
    color: "#0A4B9E",
    tagline: "Malaysia + Indonesia — asaan grammar",
  },
  {
    slug: "persian",
    name: "Persian (Farsi)",
    native: "فارسی",
    nameUr: "فارسی",
    group: "mideast",
    rtl: true,
    script: "arabic",
    font: "naskh",
    tts: ["fa-IR"],
    tile: { kind: "flag", cc: "IR" },
    color: "#2F8C4E",
    tagline: "Farsi — shairi aur saqafat ki zubaan",
  },
  {
    slug: "punjabi",
    name: "Punjabi",
    native: "پنجابی",
    nameUr: "پنجابی",
    group: "pksa",
    rtl: true,
    script: "nastaliq",
    font: "nastaliq",
    tts: ["pa-IN", "ur-PK"],
    tile: { kind: "glyph", text: "پنج" },
    color: "#C4432B",
    tagline: "Apni zubaan — Shahmukhi script mein",
    popular: true,
  },
  {
    slug: "pashto",
    name: "Pashto",
    native: "پښتو",
    nameUr: "پشتو",
    group: "pksa",
    rtl: true,
    script: "arabic",
    font: "naskh",
    tts: ["ps-AF", "ur-PK"],
    tile: { kind: "glyph", text: "ښتو" },
    color: "#2E7D32",
    tagline: "Apni zubaan — Pukhtoon culture ke sath",
    popular: true,
  },
  {
    slug: "sindhi",
    name: "Sindhi",
    native: "سنڌي",
    nameUr: "سندھی",
    group: "pksa",
    rtl: true,
    script: "arabic",
    font: "naskh",
    tts: ["sd-PK", "ur-PK"],
    tile: { kind: "glyph", text: "سنڌ" },
    color: "#8C2F6B",
    tagline: "Apni zubaan — Shah Latif ki dharti",
    popular: true,
  },
  {
    slug: "balochi",
    name: "Balochi",
    native: "بلوچی",
    nameUr: "بلوچی",
    group: "pksa",
    rtl: true,
    script: "arabic",
    font: "naskh",
    tts: ["bal", "ur-PK"],
    tile: { kind: "glyph", text: "بلو" },
    color: "#9E6B12",
    tagline: "Apni zubaan — Balochistan ki awaaz",
    popular: true,
  },
];

export const LANG_SLUGS: string[] = LANG_REGISTRY.map((l) => l.slug);

export const GROUP_LABELS: Record<LangGroup, string> = {
  popular: "Popular",
  europe: "Europe",
  asia: "Asia",
  mideast: "Middle East",
  pksa: "Pakistan & South Asia",
};

export const GROUP_ORDER: LangGroup[] = ["popular", "europe", "asia", "mideast", "pksa"];

export function getLangMeta(slug: string | null | undefined): LangMeta | undefined {
  if (!slug) return undefined;
  return LANG_REGISTRY.find((l) => l.slug === slug);
}

export function isKnownLang(slug: string | null | undefined): slug is string {
  return !!slug && LANG_SLUGS.includes(slug);
}

/** Human label, safe for metadata / titles. */
export function langLabel(slug: string): string | null {
  return getLangMeta(slug)?.name ?? null;
}

/** Languages whose lesson content must render right-to-left. */
export const RTL_LANGS: string[] = LANG_REGISTRY.filter((l) => l.rtl).map((l) => l.slug);
