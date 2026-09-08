import type { LangKey } from "./store";

export function isLangKey(v: string | null | undefined): v is LangKey {
  return v === "en" || v === "roman" || v === "ur";
}

/** Pure mapping — used by tests and the document applicator. */
export function documentLangAttrs(lang: LangKey): { dir: "rtl" | "ltr"; htmlLang: string } {
  return lang === "ur" ? { dir: "rtl", htmlLang: "ur" } : { dir: "ltr", htmlLang: "en" };
}
