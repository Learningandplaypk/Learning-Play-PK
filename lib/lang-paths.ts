/**
 * Route/label helpers for learning languages — thin re-exports over the
 * registry so server components (metadata, sitemap) and client components
 * (hub, path, picker) agree on the same 21 slugs.
 */
import { LANG_SLUGS, getLangMeta, langLabel as registryLabel } from "./lang-registry";

/** Every route under /learn/<lang>. Keep in sync with generateStaticParams. */
export const LANG_PATHS: string[] = LANG_SLUGS;

export function langLabel(slug: string): string | null {
  return registryLabel(slug);
}

export function langNative(slug: string): string {
  return getLangMeta(slug)?.native ?? slug;
}

export function langUrduName(slug: string): string {
  return getLangMeta(slug)?.nameUr ?? slug;
}

export function isRtlLang(slug: string): boolean {
  return !!getLangMeta(slug)?.rtl;
}

/**
 * Direction for a game screen. Only the learn zone carries a learning language,
 * so RTL applies to lesson screens and nowhere else in the app.
 */
export function lessonDirection(
  zone: "learn" | "brain" | "quiz" | "fun",
  slug: string | undefined
): "rtl" | "ltr" {
  return zone === "learn" && isRtlLang(slug ?? "") ? "rtl" : "ltr";
}

export { getLangMeta, LANG_SLUGS };
