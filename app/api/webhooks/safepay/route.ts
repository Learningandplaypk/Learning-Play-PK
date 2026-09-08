import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { isAdminConfigured } from "@/lib/firebase-admin";
import { activatePremium, creditCoins, deactivatePremium } from "@/lib/webhook-activate";
import { PRICES } from "@/lib/checkout-shared";
import { envStr } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Safepay webhook — verifies x-safepay-signature (HMAC-SHA256 of the raw body).
 * Sets isPremium / premiumExpiry / premiumPlan, credits coin packs and handles
 * cancellations. Docs: docs.getsafepay.com
 *
 * Env: SAFEPAY_WEBHOOK_SECRET (falls back to SAFEPAY_SECRET_KEY).
 */
export async function POST(req: Request) {
  const secret = envStr("SAFEPAY_WEBHOOK_SECRET") ?? envStr("SAFEPAY_SECRET_KEY");
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
    type?: string;
    amount?: number;
    customer?: { email?: string };
    metadata?: string | { uid?: string; planId?: string; coins?: number; trial?: boolean; email?: string };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let meta: { uid?: string; planId?: string; coins?: number; trial?: boolean; email?: string } = {};
  try {
    meta = typeof payload.metadata === "string" ? JSON.parse(payload.metadata) : (payload.metadata ?? {});
  } catch {
    meta = {};
  }
  const uid = meta.uid;
  const state = payload.payment_state ?? payload.status ?? payload.type ?? "";

  if (!isAdminConfigured) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing — cannot write entitlement");
    return NextResponse.json({ received: true, activated: false, reason: "admin sdk not configured" });
  }
  if (!uid) return NextResponse.json({ received: true, activated: false, reason: "no uid" });

  // cancellation / refund → downgrade at the end of the paid period is handled by
  // expiry; an explicit cancel event clears the flag straight away.
  if (/cancel|refund|charge.?back/i.test(state)) {
    await deactivatePremium(uid, state);
    return NextResponse.json({ received: true, activated: false, cancelled: true });
  }

  if (!/paid|succeeded|completed|captur/i.test(state)) {
    return NextResponse.json({ received: true, activated: false, state });
  }

  if (meta.coins && meta.coins > 0) {
    await creditCoins(uid, meta.coins);
    return NextResponse.json({ received: true, activated: true, coins: meta.coins });
  }

  const planId = meta.planId ?? "premium-monthly";
  const plan = PRICES[planId];
  const trialDays = meta.trial ? (plan?.trialDays ?? 0) : 0;
  const result = await activatePremium({
    uid,
    planId,
    provider: "safepay",
    amount: trialDays > 0 ? 0 : (payload.amount ?? plan?.amount ?? 0),
    reference: payload.tracker_id ?? payload.order_id ?? `sp-${Date.now()}`,
    email: meta.email ?? payload.customer?.email ?? null,
    trialDays,
  });

  return NextResponse.json({ received: true, activated: true, ...result });
}
