import { NextResponse } from "next/server";
import { paymentsStatus } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which payment providers are usable right now. The /premium page calls this so
 * it can show an honest "Payments abhi configure nahi hain" note instead of a
 * button that fails, and /admin uses it for the setup banner.
 * No secrets are returned — only names of missing env vars.
 */
export async function GET() {
  return NextResponse.json(paymentsStatus());
}
