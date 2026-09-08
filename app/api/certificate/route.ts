import { NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { entitlementStatus } from "@/lib/entitlements";
import { CERTIFICATE_MIN_LEVEL, verificationCode } from "@/lib/certificate";
import { pktDayKey } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Register a certificate so /verify/[code] can confirm it is genuine.
 * Premium is verified against Firestore here — the client cannot mint one by
 * flipping a local flag. The PDF itself is rendered in the browser (jsPDF).
 */
export async function POST(req: Request) {
  let body: { uid?: string; name?: string; language?: string; level?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { uid, name = "", language = "", level = 0 } = body;
  if (!uid || uid.startsWith("guest")) {
    return NextResponse.json({ error: "Certificate ke liye login zaroori hai." }, { status: 401 });
  }
  if (!language || level < CERTIFICATE_MIN_LEVEL) {
    return NextResponse.json({ error: `Level ${CERTIFICATE_MIN_LEVEL} zaroori hai.` }, { status: 400 });
  }
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Server abhi configure nahi hai." }, { status: 503 });
  }

  const db = adminDb();
  const snap = await db.collection("users").doc(uid).get();
  const d = snap.data() ?? {};
  const status = entitlementStatus({
    isPremium: !!d.isPremium,
    premiumExpiry: (d.premiumExpiry as string) ?? null,
    trialEnd: (d.trialEnd as string) ?? null,
  });
  if (!status.active) {
    return NextResponse.json({ error: "Certificate premium feature hai." }, { status: 403 });
  }

  const code = verificationCode({ uid, language, level });
  const date = pktDayKey();
  await db.collection("certificates").doc(code).set(
    {
      code,
      uid,
      name: String(name).slice(0, 60) || "Learner",
      language: String(language).slice(0, 40),
      level: Math.min(50, Math.max(1, Math.round(level))),
      date,
      issuedAt: new Date(),
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true, code, date });
}

/** Public verification: GET /api/certificate?code=LPK-XXXX-XXXX */
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") ?? "").toUpperCase();
  if (!code) return NextResponse.json({ valid: false });
  if (!isAdminConfigured) return NextResponse.json({ valid: false, reason: "not configured" });
  try {
    const snap = await adminDb().collection("certificates").doc(code).get();
    if (!snap.exists) return NextResponse.json({ valid: false });
    const d = snap.data()!;
    return NextResponse.json({
      valid: true,
      name: d.name,
      language: d.language,
      level: d.level,
      date: d.date,
      code,
    });
  } catch {
    return NextResponse.json({ valid: false, reason: "lookup failed" });
  }
}
