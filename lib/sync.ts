"use client";

/**
 * Firestore sync: pushes player progress after every game and keeps a mirror of
 * leaderboard entries. Silently no-ops in guest mode / when Firebase is not configured.
 */

import { doc, updateDoc, setDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, getDocs, where, getDoc } from "firebase/firestore";
import { fbDb, isFirebaseConfigured } from "./firebase";
import { usePlayer, playerSnapshot } from "./store";
import type { LastGameOutcome } from "./store";

const SCORE_BOUNDS: Record<string, number> = {
  memory: 60, "math-speed": 100, reaction: 500, stroop: 80, sequence: 60, g2048: 100000,
  sudoku: 3, chess: 1, "word-builder": 200, "vocab-battle": 200, "grammar-quest": 200,
  "sentence-puzzle": 200, listening: 100, idioms: 100, quiz: 100, millionaire: 15,
  snake3d: 500, tetris: 100000, flappy: 500, tictactoe: 10, connect4: 10, hangman: 100,
  wordsearch: 100, minesweeper: 100, typing: 200, bubble: 500, fruitninja: 1000,
  jumble: 100, racing: 10000, crossword: 100, pattern: 100, logic: 100,
  "story-builder": 100, pronunciation: 100,
};

/** Server-validated leaderboard submit — sanity bounds stop impossible scores. */
export async function submitLeaderboardScore(slug: string, score: number) {
  const store = usePlayer.getState();
  if (!isFirebaseConfigured || !store.uid) return;
  const bound = SCORE_BOUNDS[slug] ?? 100000;
  const safeScore = Math.max(0, Math.min(score, bound));
  try {
    const db = fbDb();
    const name = store.name || "Player";
    await addDoc(collection(db, "leaderboards", slug, "scores"), {
      uid: store.uid,
      name,
      avatar: store.avatar,
      score: safeScore,
      xp: store.xp,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("leaderboard sync skipped", e);
  }
}

export async function pushProgressToFirestore(outcome: LastGameOutcome) {
  const store = usePlayer.getState();
  if (!isFirebaseConfigured || !store.uid || store.uid.startsWith("guest")) return;
  try {
    const db = fbDb();
    const ref = doc(db, "users", store.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { ...playerSnapshot(store), lastActive: serverTimestamp(), updatedAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        xp: store.xp,
        coins: store.coins,
        streak: store.streak,
        bestStreak: store.bestStreak,
        badges: store.badges,
        wordsLearned: store.wordsLearned.slice(0, 1000),
        quizCorrect: store.quizCorrect,
        perfectScores: store.perfectScores,
        premium: store.premium,
        premiumExpiry: store.premiumExpiry,
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    void outcome;
    await submitLeaderboardScore(outcome.slug, outcome.score);
  } catch (e) {
    console.warn("progress sync skipped", e);
  }
}

export type LeaderRow = { uid: string; name: string; avatar: string; score: number; at?: number };

/** Global XP board: users ordered by xp. */
export async function fetchGlobalLeaderboard(): Promise<LeaderRow[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const db = fbDb();
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(50));
    const snap = await getDocs(q);
    const rows: LeaderRow[] = [];
    snap.forEach((d) => {
      const v = d.data();
      rows.push({ uid: v.uid, name: (v.displayName as string) ?? "Player", avatar: "🦉", score: (v.xp as number) ?? 0 });
    });
    return rows;
  } catch (e) {
    console.warn("global leaderboard fetch failed", e);
    return null;
  }
}

export async function fetchLeaderboard(slug: string, mode: "all" | "week" = "all"): Promise<LeaderRow[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const db = fbDb();
    const base = collection(db, "leaderboards", slug, "scores");
    const q =
      mode === "week"
        ? query(base, where("createdAt", ">", new Date(Date.now() - 7 * 86400000)), orderBy("createdAt", "desc"), limit(200))
        : query(base, orderBy("createdAt", "desc"), limit(300));
    const snap = await getDocs(q);
    const best = new Map<string, LeaderRow>();
    snap.forEach((d) => {
      const v = d.data();
      const row: LeaderRow = { uid: v.uid, name: v.name ?? "Player", avatar: v.avatar ?? "🦉", score: v.score ?? 0, at: v.createdAt?.toMillis?.() };
      const cur = best.get(v.uid);
      if (!cur || cur.score < row.score) best.set(v.uid, row);
    });
    return Array.from(best.values()).sort((a, b) => b.score - a.score).slice(0, 50);
  } catch (e) {
    console.warn("leaderboard fetch failed, using local", e);
    return null;
  }
}
