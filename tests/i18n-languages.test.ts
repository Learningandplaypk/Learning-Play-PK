import { describe, it, expect, beforeEach } from "vitest";
import { usePlayer, type PlayerState } from "@/lib/store";
import { documentLangAttrs, isLangKey } from "@/lib/i18n-core";
import { lessonDirection, isRtlLang } from "@/lib/lang-paths";
import { chooseTtsLang } from "@/lib/tts";
import { continueLang, displayLearningLanguages, langStat } from "@/lib/lang-progress";
import { LANG_REGISTRY } from "@/lib/lang-registry";
import { FONT_FILES, FONT_FAMILIES, fontCss } from "@/lib/lang-fonts";
import type { LangKey } from "@/lib/store-types";

/** Task A (default English + remembered choice) and Task C (my languages). */

type Migrate = (persisted: unknown) => PlayerState;
const migrate = (usePlayer.persist.getOptions() as unknown as { migrate: Migrate }).migrate;

beforeEach(() => {
  usePlayer.setState({
    lang: "en",
    learningLanguages: ["english"],
    langProgress: {},
    lastLearnLang: null,
    onboarded: false,
  });
});

describe("default UI locale is English", () => {
  it("a fresh player starts on English with English selected for learning", () => {
    const initial = usePlayer.getInitialState();
    expect(initial.lang).toBe("en");
    expect(initial.learningLanguages).toEqual(["english"]);
    expect(initial.onboarded).toBe(false);
  });

  it("the i18n key space accepts exactly en | roman | ur", () => {
    expect(isLangKey("en")).toBe(true);
    expect(isLangKey("roman")).toBe(true);
    expect(isLangKey("ur")).toBe(true);
    expect(isLangKey("de")).toBe(false);
    expect(isLangKey(null)).toBe(false);
  });

  it("browser-language sniffing is impossible: migration never invents a locale", () => {
    expect(migrate({}).lang).toBe("en");
    expect(migrate({ lang: "de" }).lang).toBe("en");
    expect(migrate({ lang: undefined }).lang).toBe("en");
  });

  it("a remembered choice survives a migration (roman + ur preserved)", () => {
    expect(migrate({ lang: "roman" }).lang).toBe("roman");
    expect(migrate({ lang: "ur" }).lang).toBe("ur");
  });

  it("persisted state keeps lang + the language list", () => {
    const partialize = (usePlayer.persist.getOptions() as unknown as { partialize: (s: never) => Record<string, unknown> })
      .partialize;
    const kept = partialize(usePlayer.getState() as never);
    expect(kept.lang).toBe("en");
    expect(kept.learningLanguages).toEqual(["english"]);
    expect(kept.onboarded).toBe(false);
  });
});

describe("first-visit onboarding happens once", () => {
  it("starts unanswered, and answering flips it forever", () => {
    expect(usePlayer.getState().onboarded).toBe(false);
    usePlayer.getState().setPlayer({ onboarded: true });
    expect(usePlayer.getState().onboarded).toBe(true);
    // migration keeps it answered, so the sheet never returns
    expect(migrate({ onboarded: true }).onboarded).toBe(true);
    expect(migrate({}).onboarded).toBe(false);
  });

  it("onboarding answers write both the locale and the language list", () => {
    const s = usePlayer.getState();
    s.setPlayer({ lang: "ur" as LangKey, onboarded: true });
    s.setLearningLanguages(["english", "urdu", "german"]);
    const after = usePlayer.getState();
    expect(after.lang).toBe("ur");
    expect(after.learningLanguages).toEqual(["english", "urdu", "german"]);
    expect(after.onboarded).toBe(true);
  });
});

describe("My Languages — add / remove / progress", () => {
  it("adds a language without duplicates", () => {
    const s = usePlayer.getState();
    expect(s.addLearningLanguage("german")).toEqual(["english", "german"]);
    expect(usePlayer.getState().addLearningLanguage("german")).toEqual(["english", "german"]);
  });

  it("removes a language but never leaves the hub empty", () => {
    const s = usePlayer.getState();
    s.addLearningLanguage("german");
    expect(usePlayer.getState().removeLearningLanguage("english")).toEqual(["german"]);
    expect(usePlayer.getState().removeLearningLanguage("german")).toEqual(["english"]);
  });

  it("ignores unknown slugs when rendering the hub", () => {
    const shown = displayLearningLanguages(["english", "klingon", "urdu"]).map((l) => l.slug);
    expect(shown).toEqual(["english", "urdu"]);
  });

  it("records per-language XP, words and plays from lesson results", () => {
    const s = usePlayer.getState();
    s.addLearningLanguage("german");
    usePlayer.getState().submitGame({
      slug: "word-builder",
      zone: "learn",
      result: { score: 60, maxScore: 80, accuracy: 0.75, timeMs: 1200 },
      words: ["buch", "haus", "tisch"],
      lang: "german",
    });
    const after = usePlayer.getState();
    expect(after.langProgress.german.plays).toBe(1);
    expect(after.langProgress.german.words).toBe(3);
    expect(after.langProgress.german.xp).toBeGreaterThan(0);
    expect(after.lastLearnLang).toBe("german");
    // brain/fun games are not attributed to a language
    usePlayer.getState().submitGame({ slug: "snake3d", zone: "fun", result: { score: 10, maxScore: 100, accuracy: 0.1, timeMs: 900 } });
    expect(usePlayer.getState().lastLearnLang).toBe("german");
    expect(usePlayer.getState().langProgress.german.plays).toBe(1);
  });

  it("keeps progress when a language is removed and re-added", () => {
    const s = usePlayer.getState();
    s.addLearningLanguage("urdu");
    usePlayer.getState().submitGame({
      slug: "vocab-battle",
      zone: "learn",
      result: { score: 40, maxScore: 150, accuracy: 0.27, timeMs: 2000 },
      words: ["pani"],
      lang: "urdu",
    });
    const xpBefore = usePlayer.getState().langProgress.urdu.xp;
    usePlayer.getState().removeLearningLanguage("urdu");
    expect(usePlayer.getState().langProgress.urdu?.xp).toBe(xpBefore);
    usePlayer.getState().addLearningLanguage("urdu");
    expect(usePlayer.getState().langProgress.urdu.xp).toBe(xpBefore);
  });

  it("exposes a level per language", () => {
    usePlayer.setState({ langProgress: { german: { xp: 1500, words: 42, plays: 9, last: 1 } } });
    const stat = langStat(usePlayer.getState().langProgress, "german");
    expect(stat.words).toBe(42);
    expect(stat.level).toBeGreaterThanOrEqual(2);
  });

  it("Continue learning follows the last-played language", () => {
    expect(continueLang(null, ["english", "german"])).toBe("english");
    expect(continueLang("german", ["english", "german"])).toBe("german");
    expect(continueLang("klingon", ["english"])).toBe("english");
    expect(continueLang(null, undefined)).toBe("english");
  });

  it("every registry language can be added (21 total, unlimited)", () => {
    const s = usePlayer.getState();
    const next = s.setLearningLanguages(LANG_REGISTRY.map((l) => l.slug));
    expect(next.length).toBe(21);
    expect(usePlayer.getState().learningLanguages.length).toBe(21);
  });
});

describe("RTL is scoped to lesson screens", () => {
  it("Urdu UI is rtl/ur; English and Roman Urdu are ltr/en", () => {
    expect(documentLangAttrs("ur")).toEqual({ dir: "rtl", htmlLang: "ur" });
    expect(documentLangAttrs("en")).toEqual({ dir: "ltr", htmlLang: "en" });
    expect(documentLangAttrs("roman")).toEqual({ dir: "ltr", htmlLang: "en" });
  });

  it("learn-zone lessons flip direction for RTL learning languages", () => {
    for (const slug of ["urdu", "arabic", "persian", "pashto", "sindhi", "balochi", "punjabi"]) {
      expect(isRtlLang(slug), slug).toBe(true);
      expect(lessonDirection("learn", slug), slug).toBe("rtl");
    }
  });

  it("other zones stay LTR even when the last language was RTL", () => {
    expect(lessonDirection("fun", "urdu")).toBe("ltr");
    expect(lessonDirection("brain", "persian")).toBe("ltr");
    expect(lessonDirection("quiz", "arabic")).toBe("ltr");
    expect(lessonDirection("learn", "german")).toBe("ltr");
    expect(lessonDirection("learn", undefined)).toBe("ltr");
  });
});

describe("TTS fallback chain", () => {
  it("prefers the exact code, then a regional sibling", () => {
    expect(chooseTtsLang(["de-DE", "de-AT"], ["de-AT", "en-US"])).toBe("de-AT");
    expect(chooseTtsLang(["de-DE"], ["de-DE"])).toBe("de-DE");
  });

  it("falls back to the documented alternative voice", () => {
    expect(chooseTtsLang(["ms-MY", "id-ID"], ["id-ID", "en-US"])).toBe("id-ID");
    expect(chooseTtsLang(["pa-IN", "ur-PK"], ["ur-PK"])).toBe("ur-PK");
    expect(chooseTtsLang(["sd-PK", "ur-PK"], ["ur-IN"])).toBe("ur-IN");
    expect(chooseTtsLang(["bal", "ur-PK"], ["ur-PK"])).toBe("ur-PK");
    expect(chooseTtsLang(["pt-BR", "pt-PT"], ["pt-PT"])).toBe("pt-PT");
  });

  it("returns null (not a throw) when the device has no matching voice", () => {
    expect(chooseTtsLang(["fa-IR"], ["en-US"])).toBeNull();
    expect(chooseTtsLang(["ps-AF", "ur-PK"], [])).toBeNull();
    expect(chooseTtsLang(["bn-BD", "bn-IN"], ["hi-IN", "en-US"])).toBeNull();
  });

  it("every registry language declares a code chain with a sensible fallback", () => {
    for (const l of LANG_REGISTRY) {
      expect(l.tts.length, l.slug).toBeGreaterThan(0);
      expect(l.tts[0], l.slug).toMatch(/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/);
    }
    const needFallback = ["malay", "punjabi", "sindhi", "balochi", "pashto"];
    for (const slug of needFallback) {
      const meta = LANG_REGISTRY.find((l) => l.slug === slug)!;
      expect(meta.tts.length, slug).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("script fonts", () => {
  it("each font key points at real copied woff2 files", () => {
    for (const key of Object.keys(FONT_FILES) as Array<keyof typeof FONT_FILES>) {
      expect(FONT_FILES[key].length).toBeGreaterThan(0);
      const css = fontCss(key);
      expect(css).toContain("@font-face");
      expect(css).toContain(FONT_FAMILIES[key]);
      for (const f of FONT_FILES[key]) expect(css).toContain(`/fonts/${f}`);
    }
  });

  it("Urdu + Punjabi share Nastaliq; Persian/Pashto/Sindhi/Balochi/Arabic use Naskh", () => {
    const font = (slug: string) => LANG_REGISTRY.find((l) => l.slug === slug)?.font;
    expect(font("urdu")).toBe("nastaliq");
    expect(font("punjabi")).toBe("nastaliq");
    for (const slug of ["persian", "pashto", "sindhi", "balochi", "arabic"]) expect(font(slug)).toBe("naskh");
    expect(font("hindi")).toBe("devanagari");
    expect(font("bengali")).toBe("bengali");
    expect(font("german")).toBeUndefined();
  });
});
