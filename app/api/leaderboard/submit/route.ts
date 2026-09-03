import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const schema = z.object({
  slug: z.string().min(1).max(48),
  score: z.number().int().min(0).max(1000000),
  name: z.string().min(1).max(24),
  avatar: z.string().max(8).default("🦉"),
  uid: z.string().min(6).max(128),
  session: z.string().max(256).optional(),
});

/** Sanity bounds — scores beyond these are rejected as impossible. */
const BOUNDS: Record<string, number> = {
  memory: 500, "math-speed": 2000, reaction: 250, stroop: 1000, sequence: 500, g2048: 500000,
  sudoku: 500, chess: 400, "word-builder": 200, "vocab-battle": 500, "grammar-quest": 500,
  "sentence-puzzle": 200, "listening-challenge": 200, "idiom-master": 200, "story-builder": 200,
  pronunciation: 200, gk: 200, pakistan: 200, science: 200, islamic: 200, history: 200,
  geography: 200, sports: 200, tech: 200, movies: 200, millionaire: 200,
  snake3d: 1000, tetris: 500000, flappy: 1000, tictactoe: 200, connect4: 200, hangman: 200,
  wordsearch: 300, minesweeper: 300, typing: 300, bubble: 1000, fruitninja: 2000,
  jumble: 200, racing: 10000, crossword: 300, pattern: 300, logic: 300,
};

/** Server-side validated leaderboard write (anti-cheat: bounds + rate limiting). */
export async function POST(req: Request) {
  if (!isAdminConfigured) return NextResponse.json({ ok: false, reason: "server not configured" }, { status: 503 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "invalid fields" }, { status: 400 });
  const { slug, score, name, avatar, uid } = parsed.data;
  const bound = BOUNDS[slug];
  if (bound === undefined) return NextResponse.json({ ok: false, reason: "unknown game" }, { status: 400 });
  if (score > bound) return NextResponse.json({ ok: false, reason: "score rejected (sanity bounds)" }, { status: 422 });

  const db = adminDb();
  // light rate-limit: max 12 submissions per uid per minute
  const rateRef = db.collection("_rate").doc(`${uid}:${Math.floor(Date.now() / 60000)}`);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(rateRef);
    const count = ((doc.data()?.c as number) ?? 0) + 1;
    if (count > 12) throw new Error("rate limited");
    tx.set(rateRef, { c: count, exp: new Date(Date.now() + 120000) });
  }).catch(() => {
    return NextResponse.json({ ok: false, reason: "rate limited" }, { status: 429 });
  });

  await db.collection("leaderboards").doc(slug).collection("scores").add({
    uid, name, avatar, score, createdAt: new Date(),
  });
  return NextResponse.json({ ok: true });
}
