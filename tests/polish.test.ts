import { describe, it, expect } from "vitest";
import { URDU_FONT_BOOTSTRAP, URDU_FONT_CSS, URDU_FONT_FILES } from "@/lib/urdu-font";
import { documentLangAttrs, isLangKey } from "@/lib/i18n-core";
import { computeRichUI } from "@/lib/rich-ui";
import { getScrollLockCount, resetScrollLockForTests } from "@/lib/scroll-lock";
import fs from "node:fs";
import path from "node:path";

describe("Urdu webfont", () => {
  it("inlines @font-face and never requests /fonts/urdu.css", () => {
    expect(URDU_FONT_CSS).toContain("@font-face");
    expect(URDU_FONT_CSS).toContain("Noto Nastaliq Urdu Variable");
    for (const f of URDU_FONT_FILES) {
      expect(URDU_FONT_CSS).toContain(`/fonts/${f}`);
    }
    expect(URDU_FONT_CSS).not.toContain("urdu.css");
    expect(URDU_FONT_BOOTSTRAP).not.toContain("urdu.css");
    expect(URDU_FONT_BOOTSTRAP).toContain("urdu-font-face");
  });

  it("gitignore only ignores woff2, not the fonts directory", () => {
    const gi = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf8");
    expect(gi).toContain("public/fonts/*.woff2");
    expect(gi).not.toMatch(/^public\/fonts\/$/m);
  });

  it("root layout does not link /fonts/urdu.css", () => {
    const layout = fs.readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).not.toContain("/fonts/urdu.css");
    expect(layout).toContain("URDU_FONT_BOOTSTRAP");
  });
});

describe("i18n RTL mapping", () => {
  it("Urdu is rtl/ur; English and Roman Urdu are ltr/en", () => {
    expect(documentLangAttrs("ur")).toEqual({ dir: "rtl", htmlLang: "ur" });
    expect(documentLangAttrs("en")).toEqual({ dir: "ltr", htmlLang: "en" });
    expect(documentLangAttrs("roman")).toEqual({ dir: "ltr", htmlLang: "en" });
  });

  it("isLangKey accepts the three locales only", () => {
    expect(isLangKey("ur")).toBe(true);
    expect(isLangKey("en")).toBe(true);
    expect(isLangKey("roman")).toBe(true);
    expect(isLangKey("fr")).toBe(false);
    expect(isLangKey(null)).toBe(false);
  });
});

describe("richUI gating", () => {
  const base = { width: 1280, reducedMotion: false, lite: false, deviceMemory: 8 };
  it("is on for desktop, motion-ok, not lite, enough RAM", () => {
    expect(computeRichUI(base)).toBe(true);
  });
  it("treats 4 GB as enough RAM", () => {
    expect(computeRichUI({ ...base, deviceMemory: 4 })).toBe(true);
  });
  it("turns off on mobile width, lite, reduced motion, or <4 GB", () => {
    expect(computeRichUI({ ...base, width: 390 })).toBe(false);
    expect(computeRichUI({ ...base, lite: true })).toBe(false);
    expect(computeRichUI({ ...base, reducedMotion: true })).toBe(false);
    expect(computeRichUI({ ...base, deviceMemory: 2 })).toBe(false);
  });
  it("unknown deviceMemory does not disqualify a desktop", () => {
    const { deviceMemory: _, ...rest } = base;
    void _;
    expect(computeRichUI(rest)).toBe(true);
  });
});

describe("scroll-lock counter (no DOM)", () => {
  it("starts at 0 after reset", () => {
    resetScrollLockForTests();
    expect(getScrollLockCount()).toBe(0);
  });
});

describe("scroll CSS root cause is gone", () => {
  it("html/body do not share overflow-x: hidden", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("html.scroll-locked");
    // the old trap
    expect(css).not.toMatch(/html,\s*body\s*\{[^}]*overflow-x:\s*hidden/s);
  });
});
