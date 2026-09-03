"use client";

/**
 * Auth provider: Google popup + Email/Password + Phone OTP via Firebase Auth.
 * Falls back to a fully-working guest mode when Firebase env vars are absent.
 * On first login, guest progress from localStorage is merged into the user's Firestore doc.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithRedirect,
  signOut,
  updateProfile,
  type AuthProvider,
  type RecaptchaVerifier,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { fbAuth, fbDb, isFirebaseConfigured } from "./firebase";
import { usePlayer, playerSnapshot } from "./store";

export type AuthUser = { uid: string; email: string | null; phone: string | null; name: string; photo: string | null };

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  /** true while we are bouncing the user to Google's redirect flow */
  redirecting: boolean;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  signupEmail: (name: string, email: string, password: string) => Promise<void>;
  loginPhone: (phone: string, verifier: RecaptchaVerifier) => Promise<string>;
  confirmOtp: (code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

/* ── popup → redirect strategy ────────────────────────────────────────────
 * Sandboxed iframes (preview embeds) and mobile in-app browsers block popups.
 * Strategy: top-level desktop → popup first; iframe/mobile → straight to
 * redirect; popup-blocked/closed errors → silent redirect fallback (no error
 * is ever surfaced to the user).
 * ------------------------------------------------------------------------ */
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/popup-blocked-by-browser",
  // some embedded/strict environments throw these instead of popup-blocked
  // when window.open is unavailable — the redirect flow then surfaces the real cause
  "auth/internal-error",
  "auth/operation-not-supported-in-this-environment",
]);

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin frame access throws → we ARE framed
  }
}

function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent);
}

const Ctx = createContext<AuthCtx | null>(null);

async function ensureUserDoc(u: User, displayName?: string) {
  const ref = doc(fbDb(), "users", u.uid);
  const snap = await getDoc(ref);
  const store = usePlayer.getState();
  const guestSnapshot = store.uid && store.uid.startsWith("guest") ? playerSnapshot(store) : null;
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid,
      displayName: displayName ?? u.displayName ?? "Player",
      email: u.email ?? null,
      phone: u.phoneNumber ?? null,
      photoURL: u.photoURL ?? null,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      isPremium: false,
      premiumExpiry: null,
      xp: guestSnapshot?.xp ?? 0,
      coins: guestSnapshot?.coins ?? 25,
      streak: guestSnapshot?.streak ?? 0,
      bestStreak: guestSnapshot?.bestStreak ?? 0,
      badges: guestSnapshot?.badges ?? [],
      wordsLearned: guestSnapshot?.wordsLearned ?? [],
      results: guestSnapshot?.results?.slice(0, 50) ?? [],
    });
    store.setPlayer({ name: displayName ?? u.displayName ?? "Player" });
  } else {
    const data = snap.data();
    // merge any offline guest progress earned before login
    if (guestSnapshot && (guestSnapshot.xp ?? 0) > ((data.xp as number) ?? 0)) {
      await updateDoc(ref, {
        xp: guestSnapshot.xp ?? 0,
        coins: Math.max((data.coins as number) ?? 0, guestSnapshot.coins ?? 0),
        badges: Array.from(new Set([...(((data.badges as string[]) ?? [])), ...(guestSnapshot.badges ?? [])])),
        bestStreak: Math.max((data.bestStreak as number) ?? 0, guestSnapshot.bestStreak ?? 0),
        lastActive: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, { lastActive: serverTimestamp() });
    }
    if (data.isPremium) store.setPlayer({ premium: true, premiumExpiry: (data.premiumExpiry as string) ?? null });
    store.setPlayer({ name: (data.displayName as string) ?? u.displayName ?? "Player" });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    // resolve any signInWithRedirect return (user lands back here logged in;
    // guest merge runs via onAuthStateChanged → ensureUserDoc below)
    getRedirectResult(fbAuth()).catch((e) => {
      console.error("[auth] redirect sign-in failed:", (e as { code?: string }).code ?? e);
    });
    const unsub = onAuthStateChanged(fbAuth(), (u) => {
      setFbUser(u);
      if (u) {
        usePlayer.getState().setPlayer({ uid: u.uid });
        ensureUserDoc(u).catch((e) => console.error("user doc sync failed", e));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const user: AuthUser | null = useMemo(() => {
    if (!fbUser) return null;
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      phone: fbUser.phoneNumber,
      name: fbUser.displayName ?? usePlayer.getState().name ?? "Player",
      photo: fbUser.photoURL,
    };
  }, [fbUser]);

  /**
   * popup first on desktop; iframe/mobile → redirect; blocked popup → silent
   * redirect fallback. Redirect-flow failures (offline / blocked navigation)
   * are never surfaced as raw auth/* codes — only a friendly message.
   */
  const loginWithProvider = useCallback(async (provider: AuthProvider) => {
    const goToRedirect = async () => {
      setRedirecting(true);
      try {
        await signInWithRedirect(fbAuth(), provider);
      } catch {
        // redirect could not even start (offline / blocked) — friendly note, no auth codes
        setRedirecting(false);
        throw new Error("Google tak pahunch nahi ban raha — internet connection check kar ke dobara koshish karo.");
      }
    };
    if (inIframe() || isMobileBrowser()) {
      await goToRedirect();
      return;
    }
    try {
      await signInWithPopup(fbAuth(), provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (POPUP_FALLBACK_CODES.has(code)) {
        await goToRedirect();
        return;
      }
      throw e;
    }
  }, []);

  const loginGoogle = useCallback(() => loginWithProvider(new GoogleAuthProvider()), [loginWithProvider]);

  const loginEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(fbAuth(), email, password);
  }, []);

  const signupEmail = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(fbAuth(), email, password);
    await updateProfile(cred.user, { displayName: name });
    await ensureUserDoc(cred.user, name);
    try {
      await fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
    } catch {
      /* welcome email is best-effort */
    }
  }, []);

  const loginPhone = useCallback(async (phone: string, verifier: RecaptchaVerifier) => {
    const confirmation = await signInWithPhoneNumber(fbAuth(), phone, verifier);
    (window as unknown as { __otpConfirm: { confirm: (c: string) => Promise<unknown> } }).__otpConfirm = confirmation;
    return confirmation.verificationId;
  }, []);

  const confirmOtp = useCallback(async (code: string) => {
    (window as unknown as { __otpConfirm: { confirm: (c: string) => Promise<unknown> } }).__otpConfirm.confirm(code);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(fbAuth(), email);
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured) await signOut(fbAuth());
    usePlayer.getState().setPlayer({ uid: null });
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        configured: isFirebaseConfigured,
        redirecting,
        loginGoogle,
        loginEmail,
        signupEmail,
        loginPhone,
        confirmOtp,
        resetPassword,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
