#!/usr/bin/env node
/**
 * ONE-SHOT migration (kept for provenance): converts the pre-2026
 * `data/langs/<slug>.ts` starter packs into the authored source format
 * `scripts/lang-src/<slug>.txt`.
 *
 * - words are joined to the shared concept list on their English gloss, so the
 *   Urdu meaning / PoS / category / level come from _concepts.txt;
 * - entries with no concept match are parked in a `# unmatched:` comment block
 *   so nothing is silently dropped;
 * - example sentences are produced from per-language @frames (see below).
 *
 * Existing files are never overwritten (use --force if you really mean it).
 */
import fs from "node:fs";
import path from "node:path";
import { parseConcepts } from "./lib/lang-source.mjs";
import { classifyPos, classifyCat } from "./lib/classify.mjs";

const ROOT = process.cwd();
const force = process.argv.includes("--force");
const LANGS = ["arabic", "turkish", "french", "spanish", "korean", "chinese", "japanese"];

/**
 * Frames use "I know the word X" style templates so they stay grammatical for
 * every noun regardless of gender / particle / measure-word rules, plus a
 * category frame where the target language allows a bare noun.
 */
const FRAMES = {
  arabic: [
    ["default", "أنا أعرف كلمة {s}.", "I know the word {en}."],
    ["food", "أنا أحب {s}.", "I like {en}."],
    ["colors", "اللون {s}.", "The color is {en}."],
    ["adjectives", "البيت {s} جدًا.", "The house is very {en}."],
    ["numbers", "الرقم {s}.", "The number is {en}."],
  ],
  turkish: [
    ["default", "{s} kelimesini biliyorum.", "I know the word {en}."],
    ["food", "{s} severim.", "I like {en}."],
    ["adjectives", "Ev çok {s}.", "The house is very {en}."],
    ["verbs", "{s} istiyorum.", "I want to {en}."],
    ["numbers", "Sayı {s}.", "The number is {en}."],
  ],
  french: [
    ["default", "Je connais le mot {s}.", "I know the word {en}."],
    ["adjectives", "La maison est très {s}.", "The house is very {en}."],
    ["verbs", "Je veux {s}.", "I want to {en}."],
    ["colors", "La couleur est {s}.", "The color is {en}."],
  ],
  spanish: [
    ["default", "Conozco la palabra {s}.", "I know the word {en}."],
    ["adjectives", "La casa es muy {s}.", "The house is very {en}."],
    ["verbs", "Quiero {s}.", "I want to {en}."],
    ["colors", "El color es {s}.", "The color is {en}."],
  ],
  korean: [
    ["default", "이 단어는 {s}입니다.", "This word is {en}."],
    ["colors", "색은 {s}이에요.", "The color is {en}."],
    ["food", "{s} 맛있어요.", "The {en} is tasty."],
    ["numbers", "숫자는 {s}이에요.", "The number is {en}."],
  ],
  chinese: [
    ["default", "我知道{s}这个词。", "I know the word {en}."],
    ["food", "我喜欢{s}。", "I like {en}."],
    ["adjectives", "这个房子很{s}。", "The house is very {en}."],
    ["verbs", "我想{s}。", "I want to {en}."],
    ["colors", "颜色是{s}。", "The color is {en}."],
    ["numbers", "数字是{s}。", "The number is {en}."],
  ],
  japanese: [
    ["default", "{s}という言葉を知っています。", "I know the word {en}."],
    ["food", "私は{s}が好きです。", "I like {en}."],
    ["adjectives", "この家はとても{s}です。", "The house is very {en}."],
    ["colors", "色は{s}です。", "The color is {en}."],
  ],
};

const CONTEXT_RULES = [
  { ctx: "greeting", keys: ["hello", "good morning", "good evening", "good night", "goodbye", "welcome", "hi", "see you"] },
  { ctx: "polite", keys: ["thank", "sorry", "excuse", "please", "pardon", "of course", "you're welcome"] },
  { ctx: "shopping", keys: ["how much", "price", "cost", "buy", "cheap", "expensive", "pay", "money"] },
  { ctx: "travel", keys: ["where", "station", "airport", "hotel", "ticket", "left", "right", "straight", "taxi", "bus", "train", "map", "toilet", "bathroom"] },
  { ctx: "food", keys: ["eat", "drink", "delicious", "menu", "coffee", "tea", "water", "breakfast", "hungry", "tasty"] },
  { ctx: "health", keys: ["doctor", "hospital", "sick", "pain", "medicine", "help"] },
  { ctx: "school", keys: ["school", "study", "learn", "understand", "know", "language", "speak", "repeat", "slowly", "mean"] },
  { ctx: "smalltalk", keys: ["name", "from", "live", "fine", "okay", "love", "nice", "beautiful", "weather", "work"] },
];

function classifyCtx(en) {
  const lower = en.toLowerCase();
  for (const r of CONTEXT_RULES) if (r.keys.some((k) => lower.includes(k))) return r.ctx;
  return "smalltalk";
}

function tuples(text, key) {
  const re = new RegExp(`\\{\\s*${key}:\\s*"([^"]*)",\\s*roman:\\s*"([^"]*)",\\s*en:\\s*"([^"]*)",\\s*ur:\\s*"([^"]*)"\\s*\\}`, "g");
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push({ a: m[1], r: m[2], en: m[3], ur: m[4] });
  return out;
}

const concepts = parseConcepts(fs.readFileSync(path.join(ROOT, "scripts/lang-src/_concepts.txt"), "utf8"));

for (const slug of LANGS) {
  const tsPath = path.join(ROOT, "data/langs", `${slug}.ts`);
  const outPath = path.join(ROOT, "scripts/lang-src", `${slug}.txt`);
  if (!fs.existsSync(tsPath)) continue;
  if (fs.existsSync(outPath) && !force) {
    console.log(`[migrate] ${slug}: source already exists — skipped`);
    continue;
  }
  const text = fs.readFileSync(tsPath, "utf8");
  const rawWords = tuples(text, "word");
  const seenNative = new Set();
  const words = [];
  let dupes = 0;
  for (const w of rawWords) {
    if (seenNative.has(w.a)) {
      dupes += 1;
      continue;
    }
    seenNative.add(w.a);
    words.push(w);
  }
  const rawPhrases = tuples(text, "phrase");
  const seenPhrase = new Set();
  const phrases = [];
  for (const ph of rawPhrases) {
    if (seenPhrase.has(ph.a)) continue;
    seenPhrase.add(ph.a);
    phrases.push(ph);
  }
  const matched = [];
  const unmatched = [];
  for (const w of words) {
    const key = w.en.toLowerCase();
    if (concepts.has(key)) matched.push(w);
    else unmatched.push(w);
  }

  const L = [];
  L.push(`# ${slug} — authored source (migrated from data/langs/${slug}.ts, then expanded).`);
  L.push(`# Words join to scripts/lang-src/_concepts.txt on the English gloss.`);
  L.push("");
  L.push("@info");
  L.push(`romanization|Consistent romanization used throughout this pack.`);
  L.push("");
  L.push("@frames");
  for (const [cat, native, en] of FRAMES[slug]) L.push(`${cat}|${native}|${en}`);
  L.push("");
  L.push("@words");
  for (const w of matched) L.push(`${w.en}|${w.a}|${w.r}`);
  if (unmatched.length) {
    L.push("");
    L.push(`# unmatched (not in _concepts.txt) — ${unmatched.length} entries carried over as extras:`);
    for (const w of unmatched) {
      const pos = classifyPos(w.en);
      L.push(`${w.en}|${w.a}|${w.r}||${w.ur}|${pos}|${classifyCat(w.en, pos)}|A2`);
    }
  }
  L.push("");
  L.push("@phrases");
  for (const p of phrases) L.push(`${p.a}|${p.r}|${p.en}|${p.ur}|${classifyCtx(p.en)}`);
  L.push("");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${L.join("\n")}\n`);
  console.log(
    `[migrate] ${slug}: ${matched.length} matched, ${unmatched.length} extras, ${phrases.length} phrases, ${dupes} duplicate native forms dropped`
  );
}
