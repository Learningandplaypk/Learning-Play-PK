"use client";

/**
 * Firebase client SDK — lazily initialized from NEXT_PUBLIC_FIREBASE_* env vars.
 * When env vars are absent the app runs fully in guest/local mode (everything still works)
 * and auth/firestore surfaces show a friendly setup notice instead of crashing.
 *
 * Import this module ONLY from inside an async function / effect, or from a
 * lazily-loaded route: it pulls in the whole client SDK. For a plain
 * "is Firebase configured?" check import `./firebase-config` instead (no SDK).
 */

import { firebaseConfig } from "./firebase-config";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

export { firebaseConfig, isFirebaseConfigured } from "./firebase-config";

type AppMod = typeof import("firebase/app");
type AuthMod = typeof import("firebase/auth");
type FsMod = typeof import("firebase/firestore");
type StorageMod = typeof import("firebase/storage");

let app: FirebaseApp | null = null;
let appMod: AppMod | null = null;
let authMod: AuthMod | null = null;
let fsMod: FsMod | null = null;
let storageMod: StorageMod | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export async function appModOf(): Promise<AppMod> {
  if (!appMod) appMod = await import("firebase/app");
  return appMod;
}

export async function authModOf(): Promise<AuthMod> {
  if (!authMod) authMod = await import("firebase/auth");
  return authMod;
}

export async function fsModOf(): Promise<FsMod> {
  if (!fsMod) fsMod = await import("firebase/firestore");
  return fsMod;
}

async function ensureApp(): Promise<FirebaseApp> {
  if (!app) {
    const m = await appModOf();
    app = m.getApps().length ? m.getApp() : m.initializeApp(firebaseConfig);
  }
  return app;
}

export async function fbAuth(): Promise<Auth> {
  if (!auth) {
    const [m, a] = await Promise.all([authModOf(), ensureApp()]);
    auth = m.getAuth(a);
  }
  return auth;
}

export async function fbDb(): Promise<Firestore> {
  if (!db) {
    const [m, a] = await Promise.all([fsModOf(), ensureApp()]);
    db = m.getFirestore(a);
  }
  return db;
}

export async function fbStorage(): Promise<FirebaseStorage> {
  const [m, a] = await Promise.all([
    storageMod ?? (storageMod = await import("firebase/storage")),
    ensureApp(),
  ]);
  return m.getStorage(a);
}

/** Firestore helpers, loaded on demand. Keeps call sites tidy. */
export async function fs() {
  return fsModOf();
}
