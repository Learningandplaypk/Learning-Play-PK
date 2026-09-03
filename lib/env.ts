/**
 * Environment-variable helpers.
 *
 * Vercel imports `.env.example` during builds, so any variable that is declared
 * (even without a value) arrives as an empty string `""` instead of `undefined`.
 * That breaks the common `process.env.X ?? "fallback"` idiom — an empty string is
 * not nullish, so the fallback never runs and things like `new URL("")` throw.
 *
 * These helpers treat empty / whitespace-only values as "not set", and centralize
 * site-URL resolution so builds succeed even with every env var empty.
 */

/** Empty/whitespace string → undefined; otherwise the trimmed value. */
export function envStr(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** envStr() with a default for missing/empty values. */
export function envStrOr(name: string, fallback: string): string {
  return envStr(name) ?? fallback;
}

/**
 * Canonical public site URL — never undefined, never empty.
 * NEXT_PUBLIC_SITE_URL wins; otherwise fall back to the Vercel deployment URL;
 * otherwise localhost for local development.
 */
export function getSiteUrl(): string {
  const explicit = envStr("NEXT_PUBLIC_SITE_URL");
  if (explicit) return explicit;
  const vercelUrl = envStr("VERCEL_URL");
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

/**
 * Parsed URL for `metadataBase` etc. Normalizes scheme-less values
 * (e.g. `learnplaypk.com` → `https://learnplaypk.com`) and never throws.
 */
export function siteUrlObj(): URL {
  const base = getSiteUrl();
  const candidate = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  try {
    return new URL(candidate);
  } catch {
    return new URL("http://localhost:3000");
  }
}
