import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { envStr, envStrOr } from "@/lib/env";

/**
 * Firebase Admin (server-side only) — used by webhooks, leaderboard score validation,
 * entitlement checks and cron jobs. Requires FIREBASE_SERVICE_ACCOUNT_KEY (the full JSON,
 * base64 or raw) in the environment. Server routes fail gracefully when it is missing.
 */

export const isAdminConfigured = !!envStr("FIREBASE_SERVICE_ACCOUNT_KEY") && !!envStr("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

let adminApp: App | null = null;

export function adminDb(): Firestore {
  if (!isAdminConfigured) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  if (!adminApp) {
    const raw = envStrOr("FIREBASE_SERVICE_ACCOUNT_KEY", "");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY must be raw or base64-encoded service-account JSON");
    }
    adminApp = getApps().length
      ? getApp()
      : initializeApp({ credential: cert(parsed as Parameters<typeof cert>[0]), projectId: envStr("NEXT_PUBLIC_FIREBASE_PROJECT_ID") });
  }
  return getFirestore(adminApp);
}
