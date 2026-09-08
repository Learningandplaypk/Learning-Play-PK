import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { entitlementStatus } from "@/lib/entitlements";
import { summarize, weeklyEmailText } from "@/lib/progress-report";
import { envStr, envStrOr } from "@/lib/env";
import type { GameRecord } from "@/lib/store-types";

export const runtime = "nodejs";

/**
 * Weekly progress email (premium). Called by the user from /progress ("send me
 * this by email") or by a scheduled cron with the CRON_SECRET header.
 * Silently reports "not configured" when RESEND_API_KEY is absent.
 */
export async function POST(req: Request) {
  const resendKey = envStr("RESEND_API_KEY");
  if (!resendKey) {
    return NextResponse.json({ sent: false, reason: "RESEND_API_KEY not set" }, { status: 200 });
  }
  let body: { uid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const uid = body.uid;
  if (!uid || uid.startsWith("guest")) return NextResponse.json({ sent: false, reason: "guest" });
  if (!isAdminConfigured) return NextResponse.json({ sent: false, reason: "admin sdk not configured" });

  const snap = await adminDb().collection("users").doc(uid).get();
  const d = snap.data() ?? {};
  const status = entitlementStatus({
    isPremium: !!d.isPremium,
    premiumExpiry: (d.premiumExpiry as string) ?? null,
    trialEnd: (d.trialEnd as string) ?? null,
  });
  if (!status.active) return NextResponse.json({ sent: false, reason: "not premium" }, { status: 403 });

  const email = d.email as string | undefined;
  if (!email) return NextResponse.json({ sent: false, reason: "no email on file" });

  const results = ((d.results as GameRecord[]) ?? []).filter((r) => r && typeof r.at === "number");
  const s = summarize(results, 7);
  try {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: envStrOr("EMAIL_FROM", "Learn & Play PK <salam@learnplaypk.com>"),
      to: email,
      subject: `Aapki hafta-war report — ${s.xp} XP`,
      text: weeklyEmailText((d.name as string) ?? (d.displayName as string) ?? "", s, (d.streak as number) ?? 0),
    });
    return NextResponse.json({ sent: true });
  } catch (e) {
    console.warn("weekly report email failed", e);
    return NextResponse.json({ sent: false, reason: "send failed" }, { status: 200 });
  }
}
