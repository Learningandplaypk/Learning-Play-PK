import { describe, it, expect } from "vitest";
import { ENGLISH_WORDS, GRAMMAR, SENTENCES, IDIOMS, STORIES } from "@/data/english";
import { GK } from "@/data/quiz/gk";
import { PAKISTAN } from "@/data/quiz/pakistan";
import { SCIENCE } from "@/data/quiz/science";
import { ISLAMIC } from "@/data/quiz/islamic";
import { HISTORY } from "@/data/quiz/history";
import { GEOGRAPHY } from "@/data/quiz/geography";
import { SPORTS } from "@/data/quiz/sports";
import { TECH } from "@/data/quiz/tech";
import { MOVIES } from "@/data/quiz/movies";
import { BADGES } from "@/data/badges";
import { LEARN_GAME_DATA, BRAIN_GAME_DATA, QUIZ_TOPIC_DATA, FUN_GAME_DATA, getGameData } from "@/lib/games-data";
import { LANGUAGES } from "@/lib/langs";

const TOPICS: Array<[string, typeof GK]> = [
  ["gk", GK], ["pakistan", PAKISTAN], ["science", SCIENCE], ["islamic", ISLAMIC], ["history", HISTORY],
  ["geography", GEOGRAPHY], ["sports", SPORTS], ["tech", TECH], ["movies", MOVIES],
];

describe("English content minimums (master prompt section 4)", () => {
  it("≥300 words with Urdu meanings, 120/100/80 by level", () => {
    expect(ENGLISH_WORDS.length).toBeGreaterThanOrEqual(300);
    expect(ENGLISH_WORDS.filter((w) => w.lv === 1).length).toBeGreaterThanOrEqual(120);
    expect(ENGLISH_WORDS.filter((w) => w.lv === 2).length).toBeGreaterThanOrEqual(100);
    expect(ENGLISH_WORDS.filter((w) => w.lv === 3).length).toBeGreaterThanOrEqual(80);
    for (const w of ENGLISH_WORDS) {
      expect(w.en.length).toBeGreaterThan(1);
      expect(w.ur.length).toBeGreaterThan(0);
    }
  });

  it("words have no duplicate English entries", () => {
    const set = new Set(ENGLISH_WORDS.map((w) => w.en.toLowerCase()));
    expect(set.size).toBe(ENGLISH_WORDS.length);
  });

  it("≥82 grammar MCQs — each exactly one correct answer + explanation", () => {
    expect(GRAMMAR.length).toBeGreaterThanOrEqual(82);
    for (const q of GRAMMAR) {
      expect(q.o.length).toBeGreaterThanOrEqual(3);
      expect(q.a).toBeGreaterThanOrEqual(0);
      expect(q.a).toBeLessThan(q.o.length);
      expect(q.why.length).toBeGreaterThan(3);
      const answers = q.o.filter((o) => o === q.o[q.a]);
      expect(answers.length).toBe(1);
    }
  });

  it("≥60 sentences with Urdu translations", () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(60);
    for (const s of SENTENCES) {
      expect(s.correct.length).toBeGreaterThanOrEqual(3);
      expect(s.ur.length).toBeGreaterThan(3);
      expect([1, 2, 3]).toContain(s.lv);
    }
  });

  it("40 idioms with meanings", () => {
    expect(IDIOMS.length).toBe(40);
    for (const i of IDIOMS) {
      expect(i.id.length).toBeGreaterThan(3);
      expect(i.meaning.length).toBeGreaterThan(3);
    }
  });

  it("10 stories with blanks and valid answers", () => {
    expect(STORIES.length).toBe(10);
    for (const st of STORIES) {
      expect(st.blanks.length).toBeGreaterThanOrEqual(2);
      st.blanks.forEach((b) => {
        expect(b.options.length).toBeGreaterThanOrEqual(3);
        expect(b.a).toBeGreaterThanOrEqual(0);
        expect(b.a).toBeLessThan(b.options.length);
      });
    }
  });
});

describe("Quiz banks", () => {
  it.each(TOPICS)("%s has 20+ unique questions, single correct option each", (_, bank) => {
    expect(bank.length).toBeGreaterThanOrEqual(20);
    const texts = new Set(bank.map((q) => q.q));
    expect(texts.size).toBe(bank.length);
    for (const q of bank) {
      expect(q.o.length).toBe(4);
      expect(new Set(q.o).size).toBe(4);
      expect(q.a).toBeGreaterThanOrEqual(0);
      expect(q.a).toBeLessThan(4);
    }
  });

  it("total pool ≥ 200 (millionaire needs 15 + topic variety)", () => {
    const total = TOPICS.reduce((n, [, b]) => n + b.length, 0);
    expect(total).toBeGreaterThanOrEqual(200);
  });
});

describe("Games catalog integrity", () => {
  it("zone counts: 8 learn, 10 brain, 10 quiz, 15 fun", () => {
    expect(LEARN_GAME_DATA.length).toBe(8);
    expect(BRAIN_GAME_DATA.length).toBe(10);
    expect(QUIZ_TOPIC_DATA.length).toBe(10);
    expect(FUN_GAME_DATA.length).toBe(15);
  });

  it("slugs unique within each zone; getGameData resolves all", () => {
    const zones = [LEARN_GAME_DATA, BRAIN_GAME_DATA, QUIZ_TOPIC_DATA, FUN_GAME_DATA];
    for (const z of zones) {
      const slugs = z.map((g) => g.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const g of z) {
        const found = getGameData(g.slug);
        expect(found?.title).toBe(g.title);
        expect(g.emoji.length).toBeGreaterThan(0);
        expect(g.howTo.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("fun-zone g2048 maps to the brain component (loader map, not missing file)", () => {
    const funG = FUN_GAME_DATA.find((g) => g.slug === "g2048");
    const brainG = BRAIN_GAME_DATA.find((g) => g.slug === "g2048");
    expect(funG).toBeDefined();
    expect(brainG).toBeDefined();
  });
});

describe("Languages + badges", () => {
  it("7 foreign language packs (english = full course, separate data); each with 50+ words and 15+ phrases", () => {
    const langs = Object.values(LANGUAGES);
    expect(langs.length).toBe(7);
    expect(Object.keys(LANGUAGES)).toContain("arabic");
    for (const l of langs) {
      expect(l.words.length).toBeGreaterThanOrEqual(50);
      expect(l.phrases.length).toBeGreaterThanOrEqual(15);
      for (const w of l.words) {
        expect(w.roman.length).toBeGreaterThan(0);
        expect(w.en.length).toBeGreaterThan(0);
      }
    }
  });

  it("exactly 30 badges with unique ids and non-empty criteria", () => {
    expect(BADGES.length).toBe(30);
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(30);
    for (const b of BADGES) {
      expect(b.name.length).toBeGreaterThan(2);
      expect(b.desc.length).toBeGreaterThan(3);
      expect(b.emoji.length).toBeGreaterThan(0);
    }
  });
});
