import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  planId: z.enum(["premium-monthly", "premium-yearly"]).optional(),
  plan: z.enum(["monthly", "yearly"]).optional(),
  coins: z.number().int().min(0).max(10000).optional(),
  amount: z.number().int().min(0).max(100000).optional(),
  uid: z.string().max(128).optional().nullable(),
});

export type CheckoutBody = z.infer<typeof bodySchema>;

export function parseBody(raw: unknown): CheckoutBody | null {
  const r = bodySchema.safeParse(raw);
  return r.success ? r.data : null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const PRICES: Record<string, { amount: number; label: string }> = {
  "premium-monthly": { amount: 399, label: "Learn & Play PK Premium (Monthly)" },
  "premium-yearly": { amount: 3990, label: "Learn & Play PK Premium (Yearly)" },
};

export function coinsPrice(coins: number): number {
  // server-side authoritative price for coin packs — client-sent amount is ignored
  const map: Record<number, number> = { 500: 50, 1200: 100, 3000: 250, 7000: 500 };
  return map[coins] ?? 0;
}
