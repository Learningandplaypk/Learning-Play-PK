"use client";

/**
 * Offline lesson packs — premium.
 *
 * Each pack is a list of same-origin URLs (the language hub + every lesson page)
 * handed to the service worker, which stores them in a dedicated
 * `lpk-pack-<lang>` cache. Removing a pack deletes that cache, so the
 * manage-storage UI can show exact per-language usage.
 */

import { LEARN_GAME_DATA } from "./games-data";
import { LANG_PATHS, langLabel } from "./lang-paths";

export const PACK_CACHE_PREFIX = "lpk-pack-";

export type PackInfo = {
  lang: string;
  label: string;
  urls: string[];
};

export function packUrls(lang: string): string[] {
  const lessons = LEARN_GAME_DATA.filter((g) => !g.langs || g.langs.includes(lang)).map(
    (g) => `/learn/${lang}/${g.slug}`
  );
  return [`/learn/${lang}`, ...lessons];
}

export function allPacks(): PackInfo[] {
  return LANG_PATHS.map((lang) => ({ lang, label: langLabel(lang) ?? lang, urls: packUrls(lang) }));
}

function swReady(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.ready.catch(() => null);
}

/** Ask the service worker to cache a pack. Resolves with the number cached. */
export async function downloadPack(lang: string): Promise<number> {
  const reg = await swReady();
  const urls = packUrls(lang);
  if (!reg?.active) {
    // no SW (dev / unsupported) — still warm the HTTP cache so the pages work offline-ish
    await Promise.all(urls.map((u) => fetch(u).catch(() => null)));
    return urls.length;
  }
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => resolve((e.data?.cached as number) ?? 0);
    reg.active!.postMessage({ type: "CACHE_PACK", lang, urls }, [channel.port2]);
    setTimeout(() => resolve(urls.length), 20000);
  });
}

export async function removePack(lang: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  return caches.delete(`${PACK_CACHE_PREFIX}${lang}`);
}

export type PackStatus = { lang: string; label: string; cached: number; total: number; bytes: number };

/** Read cache contents directly — works even if the SW is asleep. */
export async function packStatuses(): Promise<PackStatus[]> {
  const packs = allPacks();
  if (typeof caches === "undefined") {
    return packs.map((p) => ({ lang: p.lang, label: p.label, cached: 0, total: p.urls.length, bytes: 0 }));
  }
  return Promise.all(
    packs.map(async (p) => {
      let cached = 0;
      let bytes = 0;
      try {
        const cache = await caches.open(`${PACK_CACHE_PREFIX}${p.lang}`);
        const keys = await cache.keys();
        cached = keys.length;
        for (const k of keys) {
          const res = await cache.match(k);
          if (!res) continue;
          const len = Number(res.headers.get("content-length") ?? 0);
          bytes += len || (await res.clone().blob().then((b) => b.size).catch(() => 0));
        }
      } catch {
        /* storage blocked (private mode) — report zero */
      }
      return { lang: p.lang, label: p.label, cached, total: p.urls.length, bytes };
    })
  );
}

export function formatBytes(n: number): string {
  if (n <= 0) return "0 KB";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Total bytes used by all packs. */
export function totalBytes(list: PackStatus[]): number {
  return list.reduce((s, p) => s + p.bytes, 0);
}
