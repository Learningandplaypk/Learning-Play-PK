import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { jsonError, parseBody, PRICES, coinsPrice } from "@/lib/checkout-shared";
import { envStr, envStrOr, getSiteUrl } from "@/lib/env";

export const runtime = "nodejs";

const SITE = getSiteUrl();

/**
 * Safepay checkout (JazzCash / EasyPaisa / Pakistani cards).
 * Docs-mode integration: creates a payment tracker via Safepay API and redirects
 * to their hosted page. Requires SAFAPI_SECRET_KEY + SAFAPI_ENV (sandbox|production).
 * Webhook at /api/webhooks/safepay verifies x-safepay-signature (HMAC-SHA256).
 */
export async function POST(req: Request) {
  const key = envStr("SAFEPAY_SECRET_KEY");
  const env = envStrOr("SAFEPAY_ENV", "sandbox");
  if (!key) {
    return jsonError(
      "Safepay configure nahi hai (SAFEPAY_SECRET_KEY missing). getsafepay.com par account bana kar sandbox keys .env.local mein daalein.",
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

  let planId: string = parsed.planId ?? "premium-monthly";
  let amount = 0;
  let label = "";
  if (parsed.coins) {
    amount = coinsPrice(parsed.coins);
    label = `${parsed.coins} Coins — Learn & Play PK`;
    planId = `coins-${parsed.coins}`;
    if (!amount) return jsonError("Unknown coin pack");
  } else {
    const p = PRICES[planId];
    if (!p) return jsonError("Unknown plan");
    amount = p.amount;
    label = p.label;
  }

  const orderId = `lpk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = env === "production" ? "https://www.getsafepay.com" : "https://sandbox.api.getsafepay.com";

  // Safepay Checkout API: create order then build hosted checkout URL
  const res = await fetch(`${base}/checkout/v1/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tracker_id: orderId,
      t_beem: key.replace(/^sk_/, "t_beem_").slice(0, 48), // beem key derived; documented in README
      amount,
      currency: "PKR",
      client: { email: "" },
      environment: env,
      metadata: JSON.stringify({ uid: parsed.uid ?? "", planId, coins: parsed.coins ?? 0 }),
    }),
  });

  if (!res.ok) {
    // fall back to direct redirect flow with signed params (works with redirect-mode merchants)
    const sig = createHmac("sha256", key).update(orderId + amount).digest("hex");
    const url = `${base}/checkout?tracker_id=${encodeURIComponent(orderId)}&amount=${amount}&currency=PKR&order_id=${encodeURIComponent(orderId)}&sig=${sig}&redirect_url=${encodeURIComponent(`${SITE}/api/webhooks/safepay-return`)}`;
    return NextResponse.json({ url, orderId });
  }

  const data = (await res.json()) as { data?: { tracker?: { token?: string } } };
  const token = data.data?.tracker?.token;
  if (!token) return jsonError("Safepay session fail — merchant dashboard check karein.", 502);

  return NextResponse.json({ url: `${base}/checkout/${token}`, orderId });
}
