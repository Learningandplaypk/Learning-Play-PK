/**
 * Unified lesson-pack schema — one shape for all 21 learning languages.
 *
 * English keeps its historical files under `data/english/*` and is adapted into
 * this shape by `data/english/pack.ts`; every other language ships as JSON in
 * `data/langs/<slug>.json` and is loaded lazily per route (see lib/lang-pack.ts)
 * so no lesson content ever lands in the shared bundle.
 */

export type PackLevel = "A1" | "A2" | "B1";

export type PackWord = {
  /** Word in its native script. */
  w: string;
  /** Romanization (consistent scheme per language). */
  r: string;
  /** English meaning. */
  en: string;
  /** Urdu meaning (اردو). */
  ur: string;
  /** Part of speech: n / v / adj / adv / num / pron / prep / conj / intj / phrase */
  pos: string;
  /** Category: greetings, numbers, family, food, travel, time, colors, body, home, work, school, shopping, emotions, verbs, adjectives */
  cat: string;
  lv: PackLevel;
  /** Example sentence in the target language. */
  ex: string;
  /** English translation of that sentence. */
  exEn: string;
};

export type PackPhrase = {
  p: string;
  r: string;
  en: string;
  ur: string;
  /** Context tag: greeting, travel, food, school, work, shopping, health, emotion, smalltalk, polite */
  ctx: string;
};

export type PackGrammar = {
  q: string;
  o: string[];
  a: number;
  /** Explanation in English. */
  why: string;
  /** One-line Roman Urdu explanation. */
  urWhy: string;
};

/** Jumbled-sentence item — `s` is the correct order; the engine scrambles it. */
export type PackSentence = { s: string; en: string; ur: string };

export type PackListening = {
  /** Spoken text (target language). */
  t: string;
  r: string;
  en: string;
  o: string[];
  a: number;
};

export type PackStory = {
  title: string;
  emoji: string;
  /** 3–5 lines joined by "\n"; `___ (n)` marks blank n. */
  text: string;
  /** English translation of the whole story. */
  en: string;
  blanks: Array<{ o: string[]; a: number }>;
};

export type PackIdiom = {
  /** Idiom / proverb in the target language. */
  i: string;
  r: string;
  /** Meaning in English. */
  m: string;
  /** Meaning in Urdu. */
  ur: string;
  ex: string;
};

export type PackAlphabet = {
  title: string;
  intro: string;
  rows: Array<{ ch: string; r: string; name: string; ex: string }>;
};

export type PackCounts = {
  words: number;
  phrases: number;
  grammar: number;
  sentences: number;
  listening: number;
  stories: number;
  idioms: number;
};

export type LangPack = {
  slug: string;
  version: number;
  /** Human-readable note on the romanization scheme used in this pack. */
  romanization?: string;
  meta: PackCounts;
  words: PackWord[];
  phrases: PackPhrase[];
  grammar: PackGrammar[];
  sentences: PackSentence[];
  listening: PackListening[];
  stories: PackStory[];
  idioms: PackIdiom[];
  alphabet?: PackAlphabet;
};

export const WORD_CATEGORIES = [
  "greetings",
  "numbers",
  "family",
  "food",
  "travel",
  "time",
  "colors",
  "body",
  "home",
  "work",
  "school",
  "shopping",
  "emotions",
  "verbs",
  "adjectives",
] as const;

export const PACK_COUNT_KEYS: Array<keyof PackCounts> = [
  "words",
  "phrases",
  "grammar",
  "sentences",
  "listening",
  "stories",
  "idioms",
];
