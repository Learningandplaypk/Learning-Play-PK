import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), name: z.string().max(64).optional() });

/** Welcome email via Resend. Env-gated; silently reports "not configured". */
export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ sent: false, reason: "RESEND_API_KEY missing — welcome email skipped" });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ sent: false, reason: "invalid json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ sent: false, reason: "invalid email" }, { status: 400 });

  const resend = new Resend(key);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Learn & Play PK <salam@learnplaypk.com>",
    to: parsed.data.email,
    subject: "Khush Aamdeed — Learn & Play PK! 🎮",
    text: `Salam ${parsed.data.name ?? ""}!\n\nLearn & Play PK par khush aamdeed — Pakistan ka pehla 3D learning arcade.\n\nShuru kaise karein:\n1. Learn Zone se English lessons parho\n2. Brain aur Fun zones ke games khelo\n3. Roz aao — streak jalao, badges kamao\n\nChalo shuru karein! 🚀\n— Learn & Play PK team`,
  });
  return NextResponse.json({ sent: true });
}
