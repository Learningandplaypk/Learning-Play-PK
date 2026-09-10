import type { LangPack, PackLevel, PackListening, PackWord } from "@/lib/lang-pack-types";
import { ENGLISH_WORDS, GRAMMAR, IDIOMS, SENTENCES, STORIES } from "./index";

/**
 * English keeps its long-standing content files; this adapter maps them into the
 * unified LangPack shape so every game engine can treat all 21 languages the
 * same way. Nothing here adds content — pos/cat are derived from the gloss.
 */

const VERBS = new Set(
  ("go come eat drink read write speak listen see look give take make do run walk sleep wake open close buy sell pay learn teach work play sing dance cook wash clean help ask answer wait find lose win start stop live love like want need know think understand remember forget call meet visit travel drive ride fly swim jump sit stand fall break cut put carry hold push pull send receive write").split(
    /\s+/
  )
);

const ADJ_HINTS = [
  "big", "small", "new", "old", "fast", "slow", "good", "bad", "happy", "sad", "hot", "cold", "easy",
  "hard", "long", "short", "tall", "young", "rich", "poor", "clean", "dirty", "beautiful", "strong",
  "weak", "quiet", "loud", "dark", "bright", "sweet", "sour", "fresh", "angry", "tired", "hungry",
  "thirsty", "free", "busy", "important", "cheap", "expensive", "late", "early", "near", "far",
];

function classifyPos(en: string): string {
  const lower = en.toLowerCase();
  if (/^(i|you|he|she|it|we|they|my|your|his|her|our|their|this|that|these|those|who|what|which)$/.test(lower)) {
    return "pron";
  }
  if (/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|zero)$/.test(lower)) {
    return "num";
  }
  if (VERBS.has(lower.split(" ")[0])) return "v";
  if (lower.startsWith("to ")) return "v";
  if (lower.endsWith("ly")) return "adv";
  if (ADJ_HINTS.some((a) => lower === a || lower.startsWith(`${a} `))) return "adj";
  return "n";
}

type CatRule = { cat: string; keys: string[] };

const CAT_RULES: CatRule[] = [
  { cat: "greetings", keys: ["hello", "good morning", "good night", "thank", "sorry", "please", "welcome", "goodbye", "bye"] },
  { cat: "numbers", keys: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "number", "zero", "hundred", "thousand"] },
  { cat: "family", keys: ["mother", "father", "sister", "brother", "son", "daughter", "uncle", "aunt", "family", "child", "wife", "husband", "grand", "parent", "friend", "neighbour", "neighbor"] },
  { cat: "food", keys: ["water", "bread", "milk", "apple", "rice", "meat", "tea", "sugar", "salt", "egg", "fish", "food", "fruit", "mango", "banana", "orange", "vegetable", "oil", "flour", "chicken", "curry", "sweet", "breakfast", "lunch", "dinner", "juice", "coffee", "soup", "butter", "honey", "lemon", "onion", "tomato", "potato", "cake", "biscuit"] },
  { cat: "travel", keys: ["car", "bus", "train", "plane", "airplane", "road", "street", "airport", "station", "ticket", "map", "city", "village", "country", "journey", "travel", "vehicle", "bicycle", "bike", "boat", "bridge", "hotel", "luggage"] },
  { cat: "time", keys: ["day", "night", "week", "month", "year", "hour", "minute", "morning", "evening", "today", "tomorrow", "yesterday", "time", "clock", "season", "summer", "winter", "spring", "autumn", "monday", "sunday", "weekend", "date"] },
  { cat: "colors", keys: ["red", "blue", "green", "yellow", "black", "white", "color", "colour", "orange", "brown", "grey", "gray", "pink", "purple", "golden", "silver"] },
  { cat: "body", keys: ["hand", "eye", "head", "heart", "leg", "foot", "arm", "ear", "nose", "mouth", "hair", "face", "finger", "tooth", "teeth", "back", "neck", "shoulder", "knee", "body", "blood", "skin", "brain", "stomach"] },
  { cat: "home", keys: ["house", "home", "room", "door", "window", "kitchen", "bed", "table", "chair", "wall", "roof", "floor", "garden", "light", "fan", "lamp", "mirror", "key", "stairs", "bathroom", "sofa", "cupboard"] },
  { cat: "work", keys: ["work", "job", "office", "money", "salary", "meeting", "boss", "worker", "business", "company", "duty", "career", "staff", "manager", "farmer", "shop", "market", "customer", "price", "factory", "tool"] },
  { cat: "school", keys: ["book", "pen", "school", "student", "teacher", "class", "exam", "paper", "lesson", "study", "question", "answer", "page", "library", "homework", "mark", "grade", "university", "college", "subject", "science", "history", "math", "language", "word", "letter", "sentence", "dictionary", "pencil", "bag", "board", "test", "result", "knowledge", "education"] },
  { cat: "shopping", keys: ["shop", "buy", "sell", "price", "cheap", "expensive", "money", "rupee", "coin", "note", "bill", "bag", "market", "customer", "size", "weigh", "receipt", "discount", "pay"] },
  { cat: "emotions", keys: ["happy", "sad", "angry", "love", "fear", "afraid", "hope", "wish", "joy", "worry", "surprise", "proud", "shame", "peace", "laugh", "cry", "smile", "feel", "mood", "brave", "lonely"] },
  { cat: "verbs", keys: [] },
  { cat: "adjectives", keys: [] },
];

function classifyCat(w: { en: string; pos: string }): string {
  const lower = w.en.toLowerCase();
  for (const rule of CAT_RULES) {
    if (rule.keys.some((k) => lower === k || lower.includes(` ${k}`) || lower.startsWith(`${k} `))) return rule.cat;
  }
  if (w.pos === "v") return "verbs";
  if (w.pos === "adj") return "adjectives";
  return "school";
}

const LV_MAP: Record<1 | 2 | 3, PackLevel> = { 1: "A1", 2: "A2", 3: "B1" };

function toWords(): PackWord[] {
  return ENGLISH_WORDS.map((w) => {
    const pos = classifyPos(w.en);
    return {
      w: w.en,
      r: w.ipa ?? "",
      en: w.en,
      ur: w.ur,
      pos,
      cat: classifyCat({ en: w.en, pos }),
      lv: LV_MAP[w.lv],
      ex: w.ex ?? "",
      exEn: w.ex ?? "",
    };
  });
}

/** Listening items for English, built from the existing sentence + word pools. */
function toListening(): PackListening[] {
  const items: PackListening[] = [];
  for (const s of SENTENCES.slice(0, 10)) {
    const t = s.correct.join(" ");
    const wrongs = SENTENCES.filter((x) => x !== s)
      .slice(0, 40)
      .map((x) => x.correct.join(" "))
      .filter((x) => x !== t)
      .slice(0, 2);
    items.push({ t, r: t, en: t, o: [t, ...wrongs], a: 0 });
  }
  const pool = ENGLISH_WORDS.filter((w) => w.lv === 1).slice(0, 10);
  for (const w of pool) {
    const wrongs = ENGLISH_WORDS.filter((x) => x.en !== w.en && x.lv === 1)
      .slice(0, 40)
      .map((x) => x.en)
      .filter((x) => x !== w.en)
      .slice(0, 2);
    items.push({ t: w.en, r: w.ipa ?? "", en: w.en, o: [w.en, ...wrongs], a: 0 });
  }
  return items;
}

export const ENGLISH_PACK: LangPack = {
  slug: "english",
  version: 1,
  meta: {
    words: ENGLISH_WORDS.length,
    phrases: 0,
    grammar: GRAMMAR.length,
    sentences: SENTENCES.length,
    listening: 20,
    stories: STORIES.length,
    idioms: IDIOMS.length,
  },
  words: toWords(),
  // English has no "phrases" table — Sentence Puzzle uses `sentences` directly.
  phrases: [],
  grammar: GRAMMAR.map((g) => ({ q: g.q, o: g.o, a: g.a, why: g.why, urWhy: g.why })),
  sentences: SENTENCES.map((s) => ({ s: s.correct.join(" "), en: s.correct.join(" "), ur: s.ur })),
  listening: toListening(),
  stories: STORIES.map((s) => ({
    title: s.title,
    emoji: s.emoji,
    text: s.text,
    en: s.text,
    blanks: s.blanks.map((b) => ({ o: b.options, a: b.a })),
  })),
  idioms: IDIOMS.map((i) => ({ i: i.id, r: i.id, m: i.meaning, ur: i.meaning, ex: i.ex })),
};

export default ENGLISH_PACK;
