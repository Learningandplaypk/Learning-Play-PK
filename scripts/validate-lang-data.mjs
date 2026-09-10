#!/usr/bin/env node
/**
 * Schema + content validation for every language pack in data/langs/.
 *
 *   npm run lang:validate            # all packs
 *   npm run lang:validate -- hindi   # a subset
 *
 * Prints every offending row and exits non-zero if anything fails, so authors
 * can fix the source file in one pass. Checks, per pack:
 *   - required top-level fields, positive integer version, romanization note
 *   - 300 words with every field filled, category + level from the enums,
 *     no duplicate (word, category) pairs
 *   - shape of phrases / grammar / sentences / listening / stories / idioms
 *   - MCQ sanity: >= 2 pairwise-distinct non-empty options, answer in range
 *   - RTL languages must contain Arabic-script text in the native column and
 *     must not have Latin letters leaking into it
 *   - non-Latin scripts must not fall back to ASCII in the native column
 *   - romanization stays Latin-only (tones and diacritics allowed)
 *   - manifest row agrees with the pack, and a data/_review sheet exists
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data", "langs");
const REVIEW = path.join(ROOT, "data", "_review");

const WORD_CATEGORIES = [
  "greetings", "numbers", "family", "food", "travel", "time", "colors",
  "body", "home", "work", "school", "shopping", "emotions", "verbs", "adjectives",
];
const LEVELS = ["A1", "A2", "B1"];

const RTL_SLUGS = ["urdu", "arabic", "persian", "pashto", "sindhi", "balochi", "punjabi"];
const NON_LATIN = {
  urdu: /[\u0600-\u06FF\u0750-\u077F]/,
  arabic: /[\u0600-\u06FF\u0750-\u077F]/,
  persian: /[\u0600-\u06FF\u0750-\u077F]/,
  pashto: /[\u0600-\u06FF\u0750-\u077F]/,
  sindhi: /[\u0600-\u06FF\u0750-\u077F]/,
  balochi: /[\u0600-\u06FF\u0750-\u077F]/,
  punjabi: /[\u0600-\u06FF\u0750-\u077F]/,
  hindi: /[\u0900-\u097F]/,
  bengali: /[\u0980-\u09FF]/,
  russian: /[\u0400-\u04FF]/,
  chinese: /[\u4E00-\u9FFF]/,
  japanese: /[\u3040-\u30FF\u4E00-\u9FFF]/,
  korean: /[\uAC00-\uD7AF]/,
};
const LATIN_LETTER = /[A-Za-z]/;
const NON_ROMAN = /[^ !-~\u00C0-\u024F\u1E00-\u1EFF\u2019\u2013\u2014]/;

/**
 * Packs authored to the full spec in this release. Everything else is the
 * starter set that shipped with the original app (roughly 100 words, 30
 * phrases) and is held to a lower but still enforced bar.
 */
const FULL_SPEC = new Set([
  "urdu", "punjabi", "pashto", "sindhi", "balochi", "persian", "german",
  "hindi", "italian", "portuguese", "russian", "bengali", "malay",
]);
const STARTER = { words: 90, phrases: 25, grammar: 0, sentences: 0, listening: 0, stories: 0, idioms: 0 };

const problems = [];
const fail = (slug, msg) => problems.push(`${slug}: ${msg}`);

const slugs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const targets = slugs.length
  ? slugs
  : fs.readdirSync(DATA).filter((f) => f.endsWith(".json") && f !== "_manifest.json").map((f) => f.replace(/\.json$/, ""));

const manifest = JSON.parse(fs.readFileSync(path.join(DATA, "_manifest.json"), "utf8"));
const manifestRows = manifest.packs ?? manifest;

function checkMcq(slug, section, o, a) {
  if (!Array.isArray(o) || o.length < 2) {
    fail(slug, `${section} needs at least 2 options`);
  } else if (new Set(o).size !== o.length) {
    fail(slug, `${section} has duplicate options ${JSON.stringify(o)}`);
  }
  if (!Number.isInteger(a) || a < 0 || a >= (o?.length ?? 0)) fail(slug, `${section} answer index ${a} out of range`);
  for (const opt of o ?? []) if (!String(opt).trim()) fail(slug, `${section} has an empty option`);
}

function checkNative(slug, section, text) {
  if (!String(text ?? "").trim()) { fail(slug, `${section} native text is empty`); return; }
  const want = NON_LATIN[slug];
  if (want && !want.test(text)) fail(slug, `${section} native text has no ${slug} script: ${JSON.stringify(text)}`);
  if (RTL_SLUGS.includes(slug) && LATIN_LETTER.test(text)) {
    fail(slug, `${section} Latin letters leaked into the RTL native column: ${JSON.stringify(text)}`);
  }
}

function checkRoman(slug, section, text) {
  if (!String(text ?? "").trim()) { fail(slug, `${section} romanization is empty`); return; }
  if (NON_ROMAN.test(text)) fail(slug, `${section} romanization has non-Latin characters: ${JSON.stringify(text)}`);
  if (text !== text.trim()) fail(slug, `${section} romanization has stray whitespace: ${JSON.stringify(text)}`);
}

for (const slug of targets) {
  const file = path.join(DATA, `${slug}.json`);
  if (!fs.existsSync(file)) { fail(slug, "data file missing"); continue; }
  const pack = JSON.parse(fs.readFileSync(file, "utf8"));

  if (pack.slug !== slug) fail(slug, `pack.slug ${JSON.stringify(pack.slug)} does not match the filename`);
  if (!Number.isInteger(pack.version) || pack.version < 1) fail(slug, `version must be a positive integer, got ${pack.version}`);
  if (!pack.romanization) fail(slug, "romanization note missing");

  const row = manifestRows[slug];
  if (!row) fail(slug, "no row in data/langs/_manifest.json");
  if (!fs.existsSync(path.join(REVIEW, `${slug}.md`))) fail(slug, `missing data/_review/${slug}.md`);

  const counts = {
    words: pack.words?.length ?? 0,
    phrases: pack.phrases?.length ?? 0,
    grammar: pack.grammar?.length ?? 0,
    sentences: pack.sentences?.length ?? 0,
    listening: pack.listening?.length ?? 0,
    stories: pack.stories?.length ?? 0,
    idioms: pack.idioms?.length ?? 0,
    alphabet: pack.alphabet?.rows?.length ?? 0,
  };
  if (row) {
    const drift = Object.keys(counts).filter((k) => counts[k] !== row[k]);
    if (drift.length) {
      fail(slug, `manifest counts drift on ${drift.join(", ")} (pack ${drift.map((k) => counts[k]).join("/")} vs manifest ${drift.map((k) => row[k]).join("/")})`);
    }
  }

  const expectWords = FULL_SPEC.has(slug) ? 300 : STARTER.words;
  if (counts.words < expectWords) fail(slug, `expected at least ${expectWords} words, got ${counts.words}`);
  const seenWord = new Map();
  for (let i = 0; i < counts.words; i++) {
    const w = pack.words[i];
    const at = `words[${i}]`;
    for (const f of ["w", "r", "en", "ur", "pos", "cat", "lv", "ex", "exEn"]) {
      if (!String(w[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    }
    if (!WORD_CATEGORIES.includes(w.cat)) fail(slug, `${at}.cat ${JSON.stringify(w.cat)} is not a known category`);
    if (!LEVELS.includes(w.lv)) fail(slug, `${at}.lv ${JSON.stringify(w.lv)} is not A1/A2/B1`);
    const key = `${w.cat}::${w.w}`;
    if (seenWord.has(key)) fail(slug, `${at} duplicates ${seenWord.get(key)} ("${w.cat}" / "${w.w}")`);
    else seenWord.set(key, at);
    checkNative(slug, at, w.w);
    checkNative(slug, `${at}.ex`, w.ex);
    checkRoman(slug, at, w.r);
  }

  const expectPhrases = FULL_SPEC.has(slug) ? 120 : STARTER.phrases;
  if (counts.phrases < expectPhrases) fail(slug, `expected at least ${expectPhrases} phrases, got ${counts.phrases}`);
  const seenPhrase = new Map();
  for (let i = 0; i < counts.phrases; i++) {
    const p = pack.phrases[i];
    const at = `phrases[${i}]`;
    for (const f of ["p", "r", "en", "ur", "ctx"]) if (!String(p[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    if (seenPhrase.has(p.p)) fail(slug, `${at} duplicates ${seenPhrase.get(p.p)} ("${p.p}")`);
    else seenPhrase.set(p.p, at);
    checkNative(slug, at, p.p);
    checkRoman(slug, at, p.r);
  }

  const minGrammar = FULL_SPEC.has(slug) ? 60 : STARTER.grammar;
  if (counts.grammar < minGrammar) fail(slug, `expected at least ${minGrammar} grammar items, got ${counts.grammar}`);
  for (let i = 0; i < counts.grammar; i++) {
    const g = pack.grammar[i];
    const at = `grammar[${i}]`;
    if (!String(g.q ?? "").trim()) fail(slug, `${at}.q is empty`);
    checkMcq(slug, at, g.o, g.a);
    for (const f of ["why", "urWhy"]) if (!String(g[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    if (g.why && g.urWhy && g.why === g.urWhy) fail(slug, `${at}.urWhy is identical to the English explanation`);
  }

  const minSentences = FULL_SPEC.has(slug) ? 40 : STARTER.sentences;
  if (counts.sentences < minSentences) fail(slug, `expected at least ${minSentences} sentences, got ${counts.sentences}`);
  for (let i = 0; i < counts.sentences; i++) {
    const s = pack.sentences[i];
    const at = `sentences[${i}]`;
    for (const f of ["s", "en", "ur"]) if (!String(s[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    if (s.s && s.s.split(/\s+/).length < 3) fail(slug, `${at} is shorter than three words: ${JSON.stringify(s.s)}`);
    checkNative(slug, at, s.s);
  }

  const minListening = FULL_SPEC.has(slug) ? 20 : STARTER.listening;
  if (counts.listening < minListening) fail(slug, `expected at least ${minListening} listening items, got ${counts.listening}`);
  for (let i = 0; i < counts.listening; i++) {
    const l = pack.listening[i];
    const at = `listening[${i}]`;
    for (const f of ["t", "r", "en"]) if (!String(l[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    checkMcq(slug, at, l.o, l.a);
    checkNative(slug, at, l.t);
    checkRoman(slug, at, l.r);
  }

  const minStories = FULL_SPEC.has(slug) ? 10 : STARTER.stories;
  if (counts.stories < minStories) fail(slug, `expected at least ${minStories} stories, got ${counts.stories}`);
  for (let i = 0; i < counts.stories; i++) {
    const st = pack.stories[i];
    const at = `stories[${i}]`;
    for (const f of ["title", "text", "en"]) if (!String(st[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    if (!Array.isArray(st.blanks) || st.blanks.length === 0) fail(slug, `${at} has no blanks`);
    for (let b = 0; b < (st.blanks?.length ?? 0); b++) {
      const blank = st.blanks[b];
      checkMcq(slug, `${at}.blanks[${b}]`, blank.o, blank.a);
    }
    if (st.text && !st.text.includes("\n")) fail(slug, `${at} text should be multi-line (3-5 lines)`);
    const lines = (st.text ?? "").split("\n").filter(Boolean).length;
    if (lines < 3 || lines > 5) fail(slug, `${at} has ${lines} lines, expected 3-5`);
    checkNative(slug, at, st.text);
  }

  const minIdioms = FULL_SPEC.has(slug) ? 25 : STARTER.idioms;
  if (counts.idioms < minIdioms) fail(slug, `expected at least ${minIdioms} idioms, got ${counts.idioms}`);
  for (let i = 0; i < counts.idioms; i++) {
    const id = pack.idioms[i];
    const at = `idioms[${i}]`;
    for (const f of ["i", "r", "m", "ur", "ex"]) if (!String(id[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    checkNative(slug, at, id.i);
    checkNative(slug, `${at}.ex`, id.ex);
    checkRoman(slug, at, id.r);
  }

  if (pack.alphabet) {
    if (!pack.alphabet.title) fail(slug, "alphabet.title is empty");
    if (!pack.alphabet.intro) fail(slug, "alphabet.intro is empty");
  }
  for (let i = 0; i < counts.alphabet; i++) {
    const a = pack.alphabet.rows[i];
    const at = `alphabet[${i}]`;
    for (const f of ["ch", "r", "ex"]) if (!String(a[f] ?? "").trim()) fail(slug, `${at}.${f} is empty`);
    if (!String(a.name ?? "").trim()) fail(slug, `${at}.name is empty`);
  }

  console.log(
    `[validate] ${slug}: ${counts.words}w ${counts.phrases}p ${counts.grammar}g ` +
    `${counts.sentences}s ${counts.listening}l ${counts.stories}st ${counts.idioms}i ${counts.alphabet}abc`,
  );
}

if (problems.length) {
  console.error(`\n[validate] ${problems.length} problem(s) across ${targets.length} pack(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`\n[validate] OK - ${targets.length} pack(s) passed.`);
