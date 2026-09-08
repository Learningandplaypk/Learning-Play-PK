import { NextResponse } from "next/server";
import Stripe from "stripe";
import { jsonError, parseBody, PRICES, coinsPrice } from "@/lib/checkout-shared";
import { envStr, getSiteUrl } from "@/lib/env";

export const runtime = "nodejs";

const SITE = getSiteUrl();

/**
 * Stripe Checkout (test + live). Requires STRIPE_SECRET_KEY.
 * Webhook at /api/webhooks/stripe activates premium / credits coins.
 */
export async function POST(req: Request) {
  const secret = envStr("STRIPE_SECRET_KEY");
  if (!secret) {
    return jsonError("Stripe configure nahi hai (STRIPE_SECRET_KEY missing). .env.local mein key daalein — code production-ready hai, test mode keys se hi chal jayega.",
      503
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = parseBody(body);
  if (!parsed) return jsonError("Invalid body");

  const stripe = new Stripe(secret);

  const planId = parsed.planId ?? (parsed.plan === "yearly" ? "premium-yearly" : "premium-monthly");
  const plan = PRICES[planId];
  // Prefer real Stripe Price IDs when configured (recommended for production);
  // otherwise fall back to inline price_data so test mode works out of the box.
  const priceId = planId === "premium-yearly" ? envStr("STRIPE_PRICE_YEARLY") : envStr("STRIPE_PRICE_MONTHLY");

  const lineItems = parsed.coins
    ? (() => {
        const amount = coinsPrice(parsed.coins);
        if (!amount) return null;
        return [
          {
            price_data: {
              currency: "pkr",
              product_data: { name: `${parsed.coins} Coins — Learn & Play PK` },
              unit_amount: amount * 100, // PKR paisa
            },
            quantity: 1,
          },
        ];
      })()
    : (() => {
        const p = plan;
        if (!p) return null;
        if (priceId) return [{ price: priceId, quantity: 1 }];
        return [
          {
            price_data: {
              currency: "pkr",
              product_data: { name: p.label },
              unit_amount: p.amount * 100,
              ...(planId === "premium-monthly" ? { recurring: { interval: "month" as const } } : { recurring: { interval: "year" as const } }),
            },
            quantity: 1,
          },
        ];
      })();

  if (!lineItems) return jsonError("Unknown plan");

  const trialDays = !parsed.coins && parsed.trial !== false ? (plan?.trialDays ?? 0) : 0;

  const session = await stripe.checkout.sessions.create({
    mode: parsed.coins ? "payment" : "subscription",
    line_items: lineItems,
    ...(trialDays > 0
      ? { subscription_data: { trial_period_days: trialDays, metadata: { uid: parsed.uid ?? "", planId } } }
      : parsed.coins
        ? {}
        : { subscription_data: { metadata: { uid: parsed.uid ?? "", planId } } }),
    ...(parsed.email ? { customer_email: parsed.email } : {}),
    success_url: `${SITE}/premium?success=1`,
    cancel_url: `${SITE}/premium?cancelled=1`,
    client_reference_id: parsed.uid ?? undefined,
    metadata: {
      uid: parsed.uid ?? "",
      ...(parsed.coins ? { coins: String(parsed.coins) } : { planId }),
    },
  });

  return NextResponse.json({ url: session.url });
}
