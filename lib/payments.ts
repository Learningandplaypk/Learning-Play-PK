/**
 * Payment provider configuration — server-side introspection so the UI can say
 * "Payments abhi configure nahi hain" instead of rendering a button that 500s.
 */

import { envStr, envStrOr } from "./env";

export type ProviderStatus = {
  id: "safepay" | "stripe";
  name: string;
  configured: boolean;
  /** Env vars that are still missing. */
  missing: string[];
  mode: string;
};

export function safepayStatus(): ProviderStatus {
  const missing: string[] = [];
  if (!envStr("SAFEPAY_SECRET_KEY")) missing.push("SAFEPAY_SECRET_KEY");
  return {
    id: "safepay",
    name: "Safepay (JazzCash / EasyPaisa / PK cards)",
    configured: missing.length === 0,
    missing,
    mode: envStrOr("SAFEPAY_ENV", "sandbox"),
  };
}

export function stripeStatus(): ProviderStatus {
  const missing: string[] = [];
  if (!envStr("STRIPE_SECRET_KEY")) missing.push("STRIPE_SECRET_KEY");
  const key = envStrOr("STRIPE_SECRET_KEY", "");
  return {
    id: "stripe",
    name: "Stripe (international cards)",
    configured: missing.length === 0,
    missing,
    mode: key.startsWith("sk_live") ? "live" : "test",
  };
}

export type PaymentsStatus = {
  anyConfigured: boolean;
  providers: ProviderStatus[];
  /** Entitlement writes need the admin SDK; without it webhooks cannot activate premium. */
  webhooksReady: boolean;
  missingWebhookVars: string[];
};

export function paymentsStatus(): PaymentsStatus {
  const providers = [safepayStatus(), stripeStatus()];
  const missingWebhookVars: string[] = [];
  if (!envStr("FIREBASE_SERVICE_ACCOUNT_KEY")) missingWebhookVars.push("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (providers[1].configured && !envStr("STRIPE_WEBHOOK_SECRET")) missingWebhookVars.push("STRIPE_WEBHOOK_SECRET");
  if (providers[0].configured && !envStr("SAFEPAY_WEBHOOK_SECRET") && !envStr("SAFEPAY_SECRET_KEY"))
    missingWebhookVars.push("SAFEPAY_WEBHOOK_SECRET");
  return {
    anyConfigured: providers.some((p) => p.configured),
    providers,
    webhooksReady: missingWebhookVars.length === 0,
    missingWebhookVars,
  };
}
