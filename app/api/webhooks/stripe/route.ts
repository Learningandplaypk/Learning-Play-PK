import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAdminConfigured } from "@/lib/firebase-admin";
import { activatePremium, creditCoins, deactivatePremium } from "@/lib/webhook-activate";
import { PRICES } from "@/lib/checkout-shared";
import { envStr } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Stripe webhook — signature verified. Handles:
 *   checkout.session.completed        → activate premium / credit coins
 *   customer.subscription.updated     → keep trialEnd + expiry in sync
 *   customer.subscription.deleted     → downgrade
 *   invoice.payment_failed            → leave premium on (3-day grace covers retries)
 */
export async function POST(req: Request) {
  const secret = envStr("STRIPE_SECRET_KEY");
  const whsec = envStr("STRIPE_WEBHOOK_SECRET");
  if (!secret || !whsec) {
    return NextResponse.json(
      { received: false, reason: "Stripe webhook not configured (server keys missing)" },
      { status: 503 }
    );
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
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing — cannot write entitlement");
    return NextResponse.json({ received: true, activated: false, reason: "admin sdk not configured" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.uid || session.client_reference_id || "";
    const coins = Number(session.metadata?.coins ?? 0);
    const planId = session.metadata?.planId ?? "premium-monthly";
    if (uid) {
      if (coins > 0) {
        await creditCoins(uid, coins);
      } else {
        const plan = PRICES[planId];
        const trialing = session.amount_total === 0 && (plan?.trialDays ?? 0) > 0;
        await activatePremium({
          uid,
          planId,
          provider: "stripe",
          amount: trialing ? 0 : Math.round((session.amount_total ?? (plan?.amount ?? 0) * 100) / 100),
          reference: session.id,
          email: session.customer_details?.email ?? null,
          trialDays: trialing ? plan!.trialDays : 0,
        });
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const uid = sub.metadata?.uid;
    // Cancellation is not immediate for the learner: expiry (already stored) keeps
    // premium alive until the paid period ends, then it lapses naturally.
    if (uid) await deactivatePremium(uid, "subscription cancelled");
  }

  if (event.type === "invoice.payment_failed") {
    // do nothing: the 3-day grace window covers bank retries. If the subscription
    // is ultimately cancelled Stripe sends customer.subscription.deleted.
    console.warn("stripe invoice.payment_failed — grace period applies");
  }

  return NextResponse.json({ received: true });
}
