"use client";

/**
 * Lightweight error reporting facade.
 *
 * - If NEXT_PUBLIC_SENTRY_DSN is set → reports to Sentry (@sentry/browser, loaded lazily).
 * - Always logs to console (so sandbox/QA output shows real errors).
 * - Never throws — reporting failures are swallowed by design.
 */

let sentryReady: Promise<unknown> | null = null;

async function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  if (!sentryReady) {
    sentryReady = import("@sentry/browser").then((Sentry) => {
      Sentry.init({ dsn, tracesSampleRate: 0.1 });
      return Sentry;
    });
  }
  return sentryReady;
}

export function captureException(err: unknown, context?: Record<string, string>) {
  const message = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.error("[learnplay]", message, context ?? "");
  initSentry()
    .then((Sentry) => {
      if (!Sentry) return;
      const s = Sentry as { captureException: (e: unknown, c?: unknown) => void; setContext: (k: string, c: unknown) => void };
      if (context) s.setContext("scene", context);
      s.captureException(err);
    })
    .catch(() => {});
}

export function captureMessage(message: string, context?: Record<string, string>) {
  // eslint-disable-next-line no-console
  console.warn("[learnplay]", message, context ?? "");
  initSentry()
    .then((Sentry) => {
      if (!Sentry) return;
      const s = Sentry as { captureMessage: (m: string, c?: unknown) => void };
      s.captureMessage(message);
    })
    .catch(() => {});
}
