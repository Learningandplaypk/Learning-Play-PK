import { NextResponse } from "next/server";
import { z } from "zod";
import { FEATURES, planAmount, planLabel, TRIAL_DAYS_YEARLY } from "./plans";

export const runtime = "nodejs";

const bodySchema = z.object({
  planId: z.enum(["premium-monthly", "premium-yearly"]).optional(),
  plan: z.enum(["monthly", "yearly"]).optional(),
  coins: z.number().int().min(0).max(10000).optional(),
  amount: z.number().int().min(0).max(100000).optional(),
  uid: z.string().max(128).optional().nullable(),
  email: z.string().email().max(160).optional().nullable(),
  /** yearly only — user opted into the 7-day free trial */
  trial: z.boolean().optional(),
});

export type CheckoutBody = z.infer<typeof bodySchema>;

export function parseBody(raw: unknown): CheckoutBody | null {
  const r = bodySchema.safeParse(raw);
  return r.success ? r.data : null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Server-authoritative prices (PKR) — mirrored from lib/plans.ts so the client
 * can never choose what it pays.
 */
export const PRICES: Record<string, { amount: number; label: string; months: number; trialDays: number }> = {
  "premium-monthly": {
    amount: planAmount("premium-monthly"),
    label: planLabel("premium-monthly"),
    months: 1,
    trialDays: 0,
  },
  "premium-yearly": {
    amount: planAmount("premium-yearly"),
    label: planLabel("premium-yearly"),
    months: 12,
    trialDays: FEATURES.yearlyTrial ? TRIAL_DAYS_YEARLY : 0,
  },
};

export function coinsPrice(coins: number): number {
  // server-side authoritative price for coin packs — client-sent amount is ignored
  const map: Record<number, number> = { 500: 50, 1200: 100, 3000: 250, 7000: 500 };
  return map[coins] ?? 0;
}
