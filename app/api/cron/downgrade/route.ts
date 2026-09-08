import { NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { entitlementStatus } from "@/lib/entitlements";
import { envStr } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Auto-downgrade sweep. Entitlement checks already treat an expired user as
 * free (expiry + 3-day grace), so this is housekeeping: it clears the stored
 * isPremium flag so exports/admin views stay truthful.
 *
 * Protect with CRON_SECRET: `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = envStr("CRON_SECRET");
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured) return NextResponse.json({ ok: false, reason: "admin sdk not configured" });

  const db = adminDb();
  const snap = await db.collection("users").where("isPremium", "==", true).limit(500).get();
  let downgraded = 0;
  const batch = db.batch();
  snap.forEach((doc) => {
    const d = doc.data();
    const status = entitlementStatus({
      isPremium: true,
      premiumExpiry: (d.premiumExpiry as string) ?? null,
      trialEnd: (d.trialEnd as string) ?? null,
    });
    if (!status.active) {
      batch.set(doc.ref, { isPremium: false, premiumPlan: null, updatedAt: new Date() }, { merge: true });
      downgraded++;
    }
  });
  if (downgraded) await batch.commit();
  return NextResponse.json({ ok: true, checked: snap.size, downgraded });
}
