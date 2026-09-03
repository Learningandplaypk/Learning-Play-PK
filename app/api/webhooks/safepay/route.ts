import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { envStr } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Safepay webhook — verifies x-safepay-signature (HMAC-SHA256 of raw body with secret).
 * Activates premium / credits coins. Docs: docs.getsafepay.com
 */
export async function POST(req: Request) {
  const secret = envStr("SAFEPAY_SECRET_KEY");
  if (!secret) return NextResponse.json({ received: false, reason: "not configured" }, { status: 503 });
  const raw = await req.text();
  const sig = req.headers.get("x-safepay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    tracker_id?: string;
    order_id?: string;
    payment_state?: string;
    status?: string;
    metadata?: string | { uid?: string; planId?: string; coins?: number };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const state = payload.payment_state ?? payload.status ?? "";
  if (!/paid|succeeded|completed/i.test(state)) {
    return NextResponse.json({ received: true, activated: false, state });
  }
  if (!isAdminConfigured) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing — cannot activate entitlement");
    return NextResponse.json({ received: true, activated: false, reason: "admin sdk not configured" });
  }

  let meta: { uid?: string; planId?: string; coins?: number } = {};
  try {
    meta = typeof payload.metadata === "string" ? JSON.parse(payload.metadata) : (payload.metadata as typeof meta) ?? {};
  } catch {
    meta = {};
  }
  const uid = meta.uid;
  if (!uid) return NextResponse.json({ received: true, activated: false, reason: "no uid" });

  const db = adminDb();
  if (meta.coins && meta.coins > 0) {
    const ref = db.collection("users").doc(uid);
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const cur = (doc.data()?.coins as number) ?? 0;
      tx.set(ref, { coins: cur + meta.coins!, updatedAt: new Date() }, { merge: true });
    });
  } else {
    const months = meta.planId === "premium-yearly" ? 12 : 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    await db.collection("users").doc(uid).set(
      { isPremium: true, premiumExpiry: expiry.toISOString().slice(0, 10), premiumPlan: meta.planId ?? "premium-monthly", updatedAt: new Date() },
      { merge: true }
    );
  }
  return NextResponse.json({ received: true, activated: true });
}
