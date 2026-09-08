#!/usr/bin/env node
/**
 * Local webhook simulator.
 *
 *   node scripts/simulate-webhooks.mjs [baseUrl]
 *
 * Posts realistic payloads at the local dev server:
 *   • Safepay success (HMAC-signed with SAFEPAY_WEBHOOK_SECRET / SAFEPAY_SECRET_KEY)
 *   • Safepay bad-signature (must be rejected with 401)
 *   • Safepay cancellation
 *   • Stripe (unsigned — expected to be rejected; use `stripe trigger` for a real one)
 *
 * Without keys configured the routes answer 503 "not configured", which is the
 * correct, non-crashing behaviour — the script reports that as PASS too.
 */

import { createHmac } from "node:crypto";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || process.env.SAFEPAY_SECRET_KEY || "";
const UID = process.env.TEST_UID || "test-uid-123";

const results = [];

function log(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function postSafepay(name, payload, { corruptSignature = false } = {}) {
  const raw = JSON.stringify(payload);
  const sig = createHmac("sha256", SECRET || "unset").update(raw).digest("hex");
  const res = await fetch(`${BASE}/api/webhooks/safepay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-safepay-signature": corruptSignature ? "deadbeef" : sig,
    },
    body: raw,
  });
  const body = await res.text();
  return { status: res.status, body };
}

const meta = (extra = {}) =>
  JSON.stringify({ uid: UID, planId: "premium-yearly", email: "test@example.com", ...extra });

async function main() {
  console.log(`→ ${BASE}\n→ Safepay secret ${SECRET ? "present" : "NOT set (503 expected)"}\n`);

  {
    const r = await postSafepay("safepay success", {
      tracker_id: `sim-${Date.now()}`,
      payment_state: "paid",
      amount: 999,
      metadata: meta(),
    });
    log("Safepay success", [200, 503].includes(r.status), `${r.status} ${r.body.slice(0, 120)}`);
  }

  {
    const r = await postSafepay(
      "safepay bad signature",
      { tracker_id: "sim-bad", payment_state: "paid", metadata: meta() },
      { corruptSignature: true }
    );
    log("Safepay bad signature rejected", [401, 503].includes(r.status), `${r.status}`);
  }

  {
    const r = await postSafepay("safepay trial", {
      tracker_id: `sim-trial-${Date.now()}`,
      payment_state: "paid",
      amount: 0,
      metadata: meta({ trial: true }),
    });
    log("Safepay 7-day trial", [200, 503].includes(r.status), `${r.status} ${r.body.slice(0, 120)}`);
  }

  {
    const r = await postSafepay("safepay cancel", {
      tracker_id: `sim-cancel-${Date.now()}`,
      payment_state: "cancelled",
      metadata: meta(),
    });
    log("Safepay cancellation", [200, 503].includes(r.status), `${r.status} ${r.body.slice(0, 120)}`);
  }

  {
    const raw = JSON.stringify({
      id: "evt_sim",
      type: "checkout.session.completed",
      data: { object: { id: "cs_sim", metadata: { uid: UID, planId: "premium-monthly" }, amount_total: 29900 } },
    });
    const res = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "t=0,v1=invalid" },
      body: raw,
    });
    // 400 = signature rejected (good), 503 = not configured (also fine)
    log("Stripe unsigned payload rejected", [400, 503].includes(res.status), `${res.status}`);
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed.`);
  if (SECRET) {
    console.log("Tip: check Firestore users/" + UID + " for isPremium / premiumExpiry.");
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("simulation failed — is the dev server running?", e.message);
  process.exit(1);
});
