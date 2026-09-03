import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Seeded pseudo-random generator (mulberry32) — deterministic games (word search etc.) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(arr: T[], count: number, rand: () => number = Math.random): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  while (out.length < count && copy.length > 0) {
    const i = Math.floor(rand() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmt(n: number) {
  return new Intl.NumberFormat("en-PK").format(n);
}

export function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Asia/Karachi calendar day key, e.g. "2026-09-03" */
export function pktDayKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function pktDayOffset(offsetDays: number, base?: string): string {
  // base = a PKT day key "YYYY-MM-DD" (interpreted at noon PKT) — keeps streak logic testable
  const d = base
    ? new Date(new Date(`${base}T07:00:00Z`).getTime() + offsetDays * 86400000)
    : new Date(Date.now() + offsetDays * 86400000);
  return pktDayKey(d);
}

export function isPhonePk(v: string) {
  return /^(\+92|92|0)?3\d{2}[- ]?\d{7}$/.test(v.trim());
}
