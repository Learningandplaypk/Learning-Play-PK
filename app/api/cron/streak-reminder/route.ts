import { NextResponse } from "next/server";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { pktDayKey, pktDayOffset } from "@/lib/utils";
import { Resend } from "resend";

export const runtime = "nodejs";

/**
 * Vercel Cron (6 PM PKT daily): emails + FCM push to users whose streak dies tonight.
 * Configure in vercel.json: path /api/cron/streak-reminder — CRON_SECRET protects it.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured) {
    return NextResponse.json({ sent: 0, reason: "Firebase admin not configured" });
  }
  const db = adminDb();
  const today = pktDayKey();
  const yesterday = pktDayOffset(-1);

  const snap = await db.collection("users").where("streak", ">", 0).limit(500).get();
  let emailed = 0;
  const jobs: Array<Promise<unknown>> = [];
  snap.forEach((doc) => {
    const u = doc.data();
    const lastActiveDay = (u.lastActiveDay as string) ?? "";
    // active yesterday but not today → streak at risk
    if (lastActiveDay === yesterday || lastActiveDay === today) {
      if (lastActiveDay === today) return;
      const email = u.email as string | undefined;
      if (email && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        jobs.push(
          resend.emails
            .send({
              from: process.env.EMAIL_FROM ?? "Learn & Play PK <salam@learnplaypk.com>",
              to: email,
              subject: `🔥 Aaj ka streak bacha lo! (${u.streak} din)`,
              text: `Sirf aaj ka ek game aur — aapka ${u.streak} din ka streak zinda rahega. Chalo ek tez game lagate hain: https://learnplaypk.com/fun`,
            })
            .then(() => void emailed++)
            .catch(() => {})
        );
      }
      // FCM push
      const token = u.fcmToken as string | undefined;
      if (token && process.env.FCM_SERVER_KEY) {
        jobs.push(
          fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: { Authorization: `key=${process.env.FCM_SERVER_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ to: token, notification: { title: "Aaj ka streak bacha lo! 🔥", body: `${u.streak} din ka streak — ek game bas!`, click_action: "https://learnplaypk.com/fun" } }),
          }).catch(() => {})
        );
      }
    }
  });
  await Promise.allSettled(jobs);
  return NextResponse.json({ ok: true, day: today, emailed });
}
