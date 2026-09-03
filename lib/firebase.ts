"use client";

/**
 * Firebase client SDK — lazily initialized from NEXT_PUBLIC_FIREBASE_* env vars.
 * When env vars are absent the app runs fully in guest/local mode (everything still works)
 * and auth/firestore surfaces show a friendly setup notice instead of crashing.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0 && firebaseConfig.appId.length > 0;

let app: FirebaseApp | null = null;

function ensureApp(): FirebaseApp {
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function fbAuth(): Auth {
  return getAuth(ensureApp());
}

export function fbDb(): Firestore {
  return getFirestore(ensureApp());
}

export function fbStorage(): FirebaseStorage {
  return getStorage(ensureApp());
}
