import { NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { entitlementStatus } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-authoritative entitlement lookup: GET /api/entitlement?uid=...
 *
 * The client store keeps a mirror of `premium` for instant UI, but every
 * premium *benefit* that costs us money (certificate issuance, weekly email)
 * re-checks here. Expiry + 3-day grace are applied server-side.
 */
export async function GET(req: Request) {
  const uid = new URL(req.url).searchParams.get("uid") ?? "";
  if (!uid || uid.startsWith("guest")) {
    return NextResponse.json({ active: false, reason: "guest" });
  }
  if (!isAdminConfigured) {
    // Not configured → nobody is premium as far as the server is concerned.
    return NextResponse.json({ active: false, reason: "admin sdk not configured" });
  }
  try {
    const snap = await adminDb().collection("users").doc(uid).get();
    const d = snap.data() ?? {};
    const status = entitlementStatus({
      isPremium: !!d.isPremium,
      premiumExpiry: (d.premiumExpiry as string) ?? null,
      premiumPlan: (d.premiumPlan as string) ?? null,
      premiumProvider: (d.premiumProvider as string) ?? null,
      trialEnd: (d.trialEnd as string) ?? null,
    });
    return NextResponse.json({ ...status, provider: d.premiumProvider ?? null });
  } catch (e) {
    console.warn("entitlement lookup failed", e);
    return NextResponse.json({ active: false, reason: "lookup failed" }, { status: 200 });
  }
}
