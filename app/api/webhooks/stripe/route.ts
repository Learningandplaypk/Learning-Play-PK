import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { envStr, envStrOr } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Stripe webhook — signature-verified. Activates premium entitlement or credits coins
 * in Firestore. Requires STRIPE_WEBHOOK_SECRET + Firebase admin credentials.
 */
export async function POST(req: Request) {
  const secret = envStr("STRIPE_SECRET_KEY");
  const whsec = envStr("STRIPE_WEBHOOK_SECRET");
  if (!secret || !whsec) {
    return NextResponse.json({ received: false, reason: "Stripe webhook not configured (server keys missing)" }, { status: 503 });
  }
  const stripe = new Stripe(secret);
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whsec);
  } catch (e) {
    console.error("stripe signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!isAdminConfigured) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing — cannot activate entitlement");
    return NextResponse.json({ received: true, activated: false, reason: "admin sdk not configured" });
  }

  const db = adminDb();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.uid || session.client_reference_id || "";
    const coins = Number(session.metadata?.coins ?? 0);
    const planId = session.metadata?.planId ?? "premium-monthly";
    if (uid) {
      if (coins > 0) {
        const ref = db.collection("users").doc(uid);
        await db.runTransaction(async (tx) => {
          const doc = await tx.get(ref);
          const cur = (doc.data()?.coins as number) ?? 0;
          tx.set(ref, { coins: cur + coins, updatedAt: new Date() }, { merge: true });
        });
      } else {
        const months = planId === "premium-yearly" ? 12 : 1;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + months);
        await db.collection("users").doc(uid).set(
          { isPremium: true, premiumExpiry: expiry.toISOString().slice(0, 10), premiumPlan: planId, premiumSince: new Date(), updatedAt: new Date() },
          { merge: true }
        );
      }
      // receipt email (best-effort)
      const resendKey = envStr("RESEND_API_KEY");
      if (resendKey) {
        try {
          const email = session.customer_details?.email;
          if (email) {
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: envStrOr("EMAIL_FROM", "Learn & Play PK <billing@learnplaypk.com>"),
              to: email,
              subject: "Receipt — Learn & Play PK",
              text: `Shukriya! Aapka payment receive ho gaya (${planId}${coins ? `, ${coins} coins` : ""}). Khelna jari rakho! 🎮`,
            });
          }
        } catch (e) {
          console.warn("receipt email failed", e);
        }
      }
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
    // deactivate on cancellation (subscription id lookups need mapping; handled via customer metadata)
    const obj = event.data.object as { customer?: string; metadata?: Record<string, string> };
    const uid = obj.metadata?.uid;
    if (uid) {
      await db.collection("users").doc(uid).set({ isPremium: false, updatedAt: new Date() }, { merge: true });
    }
  }

  return NextResponse.json({ received: true });
}
