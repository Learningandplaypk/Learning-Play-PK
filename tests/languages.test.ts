import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LANG_REGISTRY, LANG_SLUGS } from "@/lib/lang-registry";
import { hasPackLoader } from "@/lib/lang-pack";
import { WORD_CATEGORIES, type LangPack } from "@/lib/lang-pack-types";
import MANIFEST from "@/data/langs/_manifest.json";
import { LEARN_GAME_DATA } from "@/lib/games-data";

/**
 * Language-content contract.
 *
 * `data/langs/_manifest.json` is written by `npm run lang:build` from the
 * authored sources in scripts/lang-src/. These tests fail if a committed JSON
 * pack drifts from the manifest, if any entry breaks the schema, or if a
 * language's script/direction/font metadata is wrong.
 */

const COUNTS = MANIFEST as Record<string, { words: number; phrases: number; grammar: number; sentences: number; listening: number; stories: number; idioms: number; alphabet: number }>;

/**
 * Languages that currently meet the full spec:
 * 300 words · 120 phrases · 60 grammar · 40 sentences · 20 listening · 10 stories · 25 idioms.
 * Every new language is added here the moment its pack reaches those counts,
 * so the bar only ever moves up.
 */
const FULL_SPEC = [
  "urdu",
  "punjabi",
  "pashto",
  "sindhi",
  "balochi",
  "persian",
  "german",
  "hindi",
  "italian",
  "portuguese",
  "russian",
  "bengali",
  "malay",
];

const FULL_SPEC_COUNTS = { words: 300, phrases: 120, grammar: 60, sentences: 40, listening: 20, stories: 10, idioms: 25 };

function loadPack(slug: string): LangPack {
  const p = path.join(process.cwd(), "data/langs", `${slug}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8")) as LangPack;
}

const BUILT = LANG_SLUGS.filter((s) => s !== "english" && fs.existsSync(path.join(process.cwd(), "data/langs", `${s}.json`)));

describe("registry ↔ loader ↔ manifest parity", () => {
  it("every registered language has a lazy loader", () => {
    for (const slug of LANG_SLUGS) expect(hasPackLoader(slug)).toBe(true);
  });

  it("every built pack has a manifest row, and vice versa", () => {
    for (const slug of BUILT) expect(COUNTS[slug], `manifest row for ${slug}`).toBeDefined();
    for (const slug of Object.keys(COUNTS)) expect(LANG_SLUGS).toContain(slug);
  });

  it("every language has a data file on disk", () => {
    for (const slug of LANG_SLUGS.filter((s) => s !== "english")) {
      expect(fs.existsSync(path.join(process.cwd(), "data/langs", `${slug}.json`)), `data/langs/${slug}.json`).toBe(true);
    }
  });

  it("every language that has content gets lesson routes", () => {
    for (const slug of BUILT) {
      if ((COUNTS[slug]?.words ?? 0) === 0) continue;
      const games = LEARN_GAME_DATA.filter((g) => !g.langs || g.langs.includes(slug));
      expect(games.length, `${slug} lesson routes`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("pack schema (every language with content)", () => {
  for (const slug of BUILT) {
    if ((COUNTS[slug]?.words ?? 0) === 0) continue;
    const pack = loadPack(slug);

    it(`${slug}: counts match the manifest exactly`, () => {
      expect(pack.words.length).toBe(COUNTS[slug].words);
      expect(pack.phrases.length).toBe(COUNTS[slug].phrases);
      expect(pack.grammar.length).toBe(COUNTS[slug].grammar);
      expect(pack.sentences.length).toBe(COUNTS[slug].sentences);
      expect(pack.listening.length).toBe(COUNTS[slug].listening);
      expect(pack.stories.length).toBe(COUNTS[slug].stories);
      expect(pack.idioms.length).toBe(COUNTS[slug].idioms);
      expect(pack.alphabet?.rows.length ?? 0).toBe(COUNTS[slug].alphabet);
    });

    it(`${slug}: words are complete, categorized and unique`, () => {
      const seen = new Set<string>();
      for (const w of pack.words) {
        expect(w.w.length, `word ${w.w}`).toBeGreaterThan(0);
        expect(w.r.length, `romanization for ${w.w}`).toBeGreaterThan(0);
        expect(w.en.length).toBeGreaterThan(0);
        expect(w.ur.length, `urdu meaning for ${w.w}`).toBeGreaterThan(0);
        expect(["A1", "A2", "B1"]).toContain(w.lv);
        expect(WORD_CATEGORIES as readonly string[]).toContain(w.cat);
        expect(w.pos.length).toBeGreaterThan(0);
        expect(w.ex.length, `example for ${w.w}`).toBeGreaterThan(2);
        expect(w.exEn.length, `english example for ${w.w}`).toBeGreaterThan(2);
        // A word may be listed twice when it is polysemous in the target
        // language (Urdu زبان = tongue / language) — never in the same category.
        // Case-sensitive, per-category — "Morgen" (morning) and "morgen"
        // (tomorrow) are distinct German entries.
        const key = `${w.w}|${w.cat}`;
        expect(seen.has(key), `duplicate word ${w.w} in ${w.cat}`).toBe(false);
        seen.add(key);
      }
    });

    it(`${slug}: phrases have a context tag and unique text`, () => {
      const seen = new Set<string>();
      for (const p of pack.phrases) {
        expect(p.p.length).toBeGreaterThan(0);
        expect(p.r.length).toBeGreaterThan(0);
        expect(p.en.length).toBeGreaterThan(0);
        expect(p.ur.length).toBeGreaterThan(0);
        expect(p.ctx.length).toBeGreaterThan(0);
        expect(seen.has(p.p), `duplicate phrase ${p.p}`).toBe(false);
        seen.add(p.p);
      }
    });

    it(`${slug}: grammar MCQs have one valid answer + both explanations`, () => {
      for (const g of pack.grammar) {
        expect(g.o.length).toBeGreaterThanOrEqual(3);
        expect(g.a).toBeGreaterThanOrEqual(0);
        expect(g.a).toBeLessThan(g.o.length);
        expect(new Set(g.o).size).toBe(g.o.length);
        expect(g.why.length).toBeGreaterThan(3);
        expect(g.urWhy.length).toBeGreaterThan(3);
      }
    });

    it(`${slug}: jumbled sentences have ≥3 tokens and translations`, () => {
      for (const s of pack.sentences) {
        expect(s.s.split(/\s+/).length).toBeGreaterThanOrEqual(3);
        expect(s.en.length).toBeGreaterThan(2);
        expect(s.ur.length).toBeGreaterThan(2);
      }
    });

    it(`${slug}: listening items have 3 distinct options and a valid answer`, () => {
      for (const l of pack.listening) {
        expect(l.t.length).toBeGreaterThan(0);
        expect(l.o.length).toBe(3);
        expect(new Set(l.o).size).toBe(3);
        expect(l.a).toBeGreaterThanOrEqual(0);
        expect(l.a).toBeLessThan(3);
        expect(l.en.length).toBeGreaterThan(0);
      }
    });

    it(`${slug}: stories are 3–5 lines and every blank has an answer set`, () => {
      for (const st of pack.stories) {
        const lines = st.text.split("\n").filter((l) => l.trim().length > 0);
        expect(lines.length, `${st.title} lines`).toBeGreaterThanOrEqual(3);
        expect(lines.length, `${st.title} lines`).toBeLessThanOrEqual(5);
        const marks = (st.text.match(/___\s*\(\d+\)/g) || []).length;
        expect(marks).toBe(st.blanks.length);
        expect(st.en.length).toBeGreaterThan(10);
        for (const b of st.blanks) {
          expect(b.o.length).toBeGreaterThanOrEqual(2);
          expect(b.a).toBeGreaterThanOrEqual(0);
          expect(b.a).toBeLessThan(b.o.length);
        }
      }
    });

    it(`${slug}: idioms carry meaning, Urdu meaning and an example`, () => {
      for (const i of pack.idioms) {
        expect(i.i.length).toBeGreaterThan(2);
        expect(i.r.length).toBeGreaterThan(0);
        expect(i.m.length).toBeGreaterThan(3);
        expect(i.ur.length).toBeGreaterThan(3);
        expect(i.ex.length).toBeGreaterThan(3);
      }
    });
  }
});

describe("script integrity", () => {
  const RANGES: Record<string, RegExp> = {
    "arabic-script": /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/,
    devanagari: /[\u0900-\u097F]/,
    bengali: /[\u0980-\u09FF]/,
    cyrillic: /[\u0400-\u04FF]/,
    han: /[\u4E00-\u9FFF]/,
    hangul: /[\uAC00-\uD7AF\u1100-\u11FF]/,
    // Japanese mixes kanji with kana — both are expected
    kana: /[\u3040-\u30FF\u4E00-\u9FFF]/,
  };
  const EXPECT: Record<string, string> = {
    urdu: "arabic-script",
    arabic: "arabic-script",
    persian: "arabic-script",
    pashto: "arabic-script",
    sindhi: "arabic-script",
    balochi: "arabic-script",
    punjabi: "arabic-script",
    hindi: "devanagari",
    bengali: "bengali",
    russian: "cyrillic",
    chinese: "han",
    korean: "hangul",
    japanese: "kana",
  };

  for (const [slug, key] of Object.entries(EXPECT)) {
    it(`${slug}: words are written in the ${key} script`, () => {
      if ((COUNTS[slug]?.words ?? 0) === 0) return; // pack still being authored
      const re = RANGES[key];
      const bad = loadPack(slug).words.filter((w) => !re.test(w.w));
      expect(bad.map((w) => w.w).slice(0, 5)).toEqual([]);
    });
  }

  it("every non-English pack writes Urdu meanings in Urdu script", () => {
    const urduRe = /[\u0600-\u06FF\u0750-\u077F]/;
    for (const slug of BUILT) {
      if ((COUNTS[slug]?.words ?? 0) === 0) continue;
      const bad = loadPack(slug).words.filter((w) => !urduRe.test(w.ur));
      expect(bad.map((w) => w.ur).slice(0, 5), slug).toEqual([]);
    }
  });

  it("romanization is Latin (never the native script copied back)", () => {
    // Latin in any of its blocks (accents, Pinyin tone marks, Turkish ş and
    // Spanish ñ are all legitimate romanization) — what must never appear is
    // the target script itself copied back.
    const latin = /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F\u02B0-\u02FF0-9'’ʼːˈˌ.\-–— ,!?()[\]/]*$/;
    for (const slug of BUILT) {
      if ((COUNTS[slug]?.words ?? 0) === 0) continue;
      const bad = loadPack(slug).words.filter((w) => !latin.test(w.r));
      expect(bad.map((w) => w.r).slice(0, 5), slug).toEqual([]);
    }
  });

  it("RTL flags match the registry and are exactly the Perso-Arabic + Urdu set", () => {
    const rtl = LANG_REGISTRY.filter((l) => l.rtl).map((l) => l.slug).sort();
    expect(rtl).toEqual(["arabic", "balochi", "pashto", "persian", "punjabi", "sindhi", "urdu"]);
  });

  it("script fonts are declared for the scripts that need one", () => {
    for (const l of LANG_REGISTRY) {
      if (l.script === "nastaliq") expect(l.font).toBe("nastaliq");
      if (l.script === "arabic") expect(l.font).toBe("naskh");
      if (l.script === "devanagari") expect(l.font).toBe("devanagari");
      if (l.script === "bengali") expect(l.font).toBe("bengali");
    }
  });

  it("Punjabi/Pashto/Sindhi/Balochi use glyph tiles, not country flags", () => {
    for (const slug of ["punjabi", "pashto", "sindhi", "balochi"]) {
      const meta = LANG_REGISTRY.find((l) => l.slug === slug)!;
      expect(meta.tile.kind).toBe("glyph");
    }
  });
});

describe("review sheets", () => {
  it("every built language has a /data/_review/<lang>.md spot-check sheet", () => {
    for (const slug of BUILT) {
      const p = path.join(process.cwd(), "data/_review", `${slug}.md`);
      expect(fs.existsSync(p), `data/_review/${slug}.md`).toBe(true);
    }
  });
});

describe("full-spec coverage", () => {
  it("every newly authored language is pinned to the full-spec bar", () => {
    // The 13 languages added in this release (english and the 7 legacy
    // starter packs are tracked separately).
    expect(FULL_SPEC.length).toBe(13);
    expect(new Set(FULL_SPEC).size).toBe(13);
    for (const slug of FULL_SPEC) expect(LANG_SLUGS).toContain(slug);
  });

  for (const slug of FULL_SPEC) {
    it(`${slug} ships the full starter set (300/120/60/40/20/10/25)`, () => {
      const c = COUNTS[slug];
      expect(c, `${slug} manifest row`).toBeDefined();
      expect(c.words).toBeGreaterThanOrEqual(FULL_SPEC_COUNTS.words);
      expect(c.phrases).toBeGreaterThanOrEqual(FULL_SPEC_COUNTS.phrases);
      expect(c.grammar).toBeGreaterThanOrEqual(FULL_SPEC_COUNTS.grammar);
      expect(c.sentences).toBeGreaterThanOrEqual(FULL_SPEC_COUNTS.sentences);
      expect(c.listening).toBeGreaterThanOrEqual(FULL_SPEC_COUNTS.listening);
      expect(c.stories).toBeGreaterThanOrEqual(FULL_SPEC_COUNTS.stories);
      expect(c.idioms).toBeGreaterThanOrEqual(FULL_SPEC_COUNTS.idioms);
    });
  }
});
