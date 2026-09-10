import type { LangPack } from "./lang-pack-types";

/**
 * Lazy per-language pack loaders.
 *
 * Every entry is a *dynamic* import, so webpack emits one chunk per language
 * (`data/langs/<slug>.json`) and none of it is pulled into the shared bundle:
 * a learner opening /learn/german/word-builder downloads German only.
 *
 * Keep this list in lock-step with LANG_REGISTRY — tests/languages.test.ts
 * fails if a registered language has no loader or no data file.
 */
const LOADERS: Record<string, () => Promise<LangPack>> = {
  english: () => import("@/data/english/pack").then((m) => m.ENGLISH_PACK),
  urdu: () => import("@/data/langs/urdu.json").then((m) => m.default as unknown as LangPack),
  arabic: () => import("@/data/langs/arabic.json").then((m) => m.default as unknown as LangPack),
  german: () => import("@/data/langs/german.json").then((m) => m.default as unknown as LangPack),
  french: () => import("@/data/langs/french.json").then((m) => m.default as unknown as LangPack),
  spanish: () => import("@/data/langs/spanish.json").then((m) => m.default as unknown as LangPack),
  turkish: () => import("@/data/langs/turkish.json").then((m) => m.default as unknown as LangPack),
  italian: () => import("@/data/langs/italian.json").then((m) => m.default as unknown as LangPack),
  portuguese: () => import("@/data/langs/portuguese.json").then((m) => m.default as unknown as LangPack),
  russian: () => import("@/data/langs/russian.json").then((m) => m.default as unknown as LangPack),
  chinese: () => import("@/data/langs/chinese.json").then((m) => m.default as unknown as LangPack),
  japanese: () => import("@/data/langs/japanese.json").then((m) => m.default as unknown as LangPack),
  korean: () => import("@/data/langs/korean.json").then((m) => m.default as unknown as LangPack),
  hindi: () => import("@/data/langs/hindi.json").then((m) => m.default as unknown as LangPack),
  bengali: () => import("@/data/langs/bengali.json").then((m) => m.default as unknown as LangPack),
  malay: () => import("@/data/langs/malay.json").then((m) => m.default as unknown as LangPack),
  persian: () => import("@/data/langs/persian.json").then((m) => m.default as unknown as LangPack),
  punjabi: () => import("@/data/langs/punjabi.json").then((m) => m.default as unknown as LangPack),
  pashto: () => import("@/data/langs/pashto.json").then((m) => m.default as unknown as LangPack),
  sindhi: () => import("@/data/langs/sindhi.json").then((m) => m.default as unknown as LangPack),
  balochi: () => import("@/data/langs/balochi.json").then((m) => m.default as unknown as LangPack),
};

const cache = new Map<string, LangPack>();
const inflight = new Map<string, Promise<LangPack | null>>();

export function hasPackLoader(slug: string): boolean {
  return slug in LOADERS;
}

export function cachedPack(slug: string): LangPack | undefined {
  return cache.get(slug);
}

/** Fetch (and memoise) the lesson pack for a language. */
export function loadPack(slug: string): Promise<LangPack | null> {
  const loader = LOADERS[slug];
  if (!loader) return Promise.resolve(null);
  const hit = cache.get(slug);
  if (hit) return Promise.resolve(hit);
  const pending: Promise<LangPack | null> | undefined = inflight.get(slug);
  if (pending) return pending;
  const p: Promise<LangPack | null> = loader()
    .then((pack) => {
      cache.set(slug, pack);
      inflight.delete(slug);
      return pack;
    })
    .catch((err) => {
      inflight.delete(slug);
      console.warn(`[lang-pack] ${slug} failed to load`, err);
      return null;
    });
  inflight.set(slug, p);
  return p;
}
