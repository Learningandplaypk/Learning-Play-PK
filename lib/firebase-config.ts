/**
 * Firebase *configuration only* — no SDK imports on purpose.
 *
 * The client SDK (firebase/app + auth + firestore + storage) is ~100KB gz and
 * nothing on first paint needs it: guest mode works entirely from localStorage.
 * Keeping the config in its own module lets `lib/auth.tsx` and `lib/sync.ts`
 * check `isFirebaseConfigured` and only then `await import()` the SDK, which
 * keeps the SDK out of the initial JS graph (Lighthouse mobile perf budget).
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0 && firebaseConfig.appId.length > 0;
