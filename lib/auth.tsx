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
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
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
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  signupEmail: (name: string, email: string, password: string) => Promise<void>;
  loginPhone: (phone: string, verifier: RecaptchaVerifier) => Promise<string>;
  confirmOtp: (code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

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

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
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

  const loginGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fbAuth(), provider);
  }, []);

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
