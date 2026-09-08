/**
 * Shared entitlement activation used by both payment webhooks.
 * Writes users/{uid} entitlement fields + a payments/{id} receipt, then emails
 * a receipt through Resend when configured.
 */

import { Resend } from "resend";
import { adminDb } from "./firebase-admin";
import { extendExpiry } from "./entitlements";
import { planMonths } from "./plans";
import { envStr, envStrOr } from "./env";
import { pktDayKey, pktDayOffset } from "./utils";

export type ActivationInput = {
  uid: string;
  planId: string;
  provider: "safepay" | "stripe";
  /** Amount actually charged in PKR (0 for a trial start). */
  amount: number;
  /** Provider reference (session id / tracker id) — used as the receipt doc id. */
  reference: string;
  email?: string | null;
  /** Trial length in days; when > 0 premium is granted but nothing was charged. */
  trialDays?: number;
};

export type ActivationResult = { expiry: string; trialEnd: string | null };

export async function activatePremium(input: ActivationInput): Promise<ActivationResult> {
  const db = adminDb();
  const today = pktDayKey();
  const ref = db.collection("users").doc(input.uid);
  const months = planMonths(input.planId);
  const trialDays = input.trialDays ?? 0;

  const snap = await ref.get();
  const current = (snap.data()?.premiumExpiry as string) ?? null;
  // Trials grant premium for the trial window; a real payment extends by the plan length.
  const expiry = trialDays > 0 ? pktDayOffset(trialDays, today) : extendExpiry(current, months, today);
  const trialEnd = trialDays > 0 ? pktDayOffset(trialDays, today) : null;

  await ref.set(
    {
      isPremium: true,
      premiumExpiry: expiry,
      premiumPlan: input.planId,
      premiumProvider: input.provider,
      premiumSince: snap.data()?.premiumSince ?? new Date(),
      trialEnd,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  await db
    .collection("payments")
    .doc(`${input.provider}-${input.reference}`.slice(0, 120))
    .set(
      {
        uid: input.uid,
        provider: input.provider,
        planId: input.planId,
        amount: input.amount,
        currency: "PKR",
        reference: input.reference,
        trial: trialDays > 0,
        expiry,
        createdAt: new Date(),
      },
      { merge: true }
    );

  await sendReceipt(input, expiry);
  return { expiry, trialEnd };
}

export async function creditCoins(uid: string, coins: number): Promise<void> {
  const db = adminDb();
  const ref = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const cur = (doc.data()?.coins as number) ?? 0;
    tx.set(ref, { coins: Math.min(100000, cur + coins), updatedAt: new Date() }, { merge: true });
  });
}

export async function deactivatePremium(uid: string, reason: string): Promise<void> {
  await adminDb()
    .collection("users")
    .doc(uid)
    .set({ isPremium: false, premiumPlan: null, cancelReason: reason, updatedAt: new Date() }, { merge: true });
}

async function sendReceipt(input: ActivationInput, expiry: string): Promise<void> {
  const key = envStr("RESEND_API_KEY");
  if (!key || !input.email) return;
  const trial = (input.trialDays ?? 0) > 0;
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: envStrOr("EMAIL_FROM", "Learn & Play PK <salam@learnplaypk.com>"),
      to: input.email,
      subject: trial ? "Aapka 7-din free trial shuru ho gaya" : "Receipt — Learn & Play PK Premium",
      text: [
        "Shukriya!",
        "",
        trial
          ? `Aapka 7-din ka free trial shuru ho gaya hai (${input.planId}). ${expiry} tak koi charge nahi hoga — us se pehle cancel karo to zero payment.`
          : `Aapka payment mil gaya: Rs. ${input.amount} (${input.planId}) — ${input.provider} ke zariye.`,
        `Premium ${expiry} tak active hai.`,
        "",
        "Subscription manage karna ho ya cancel karna ho: https://learnplaypk.com/account",
        "Refund 7 din ke andar, bina kisi sawal ke.",
        "",
        `Reference: ${input.reference}`,
      ].join("\n"),
    });
  } catch (e) {
    console.warn("receipt email failed", e);
  }
}
