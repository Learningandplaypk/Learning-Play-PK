import type { Metadata } from "next";
import Link from "next/link";
import { adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { isValidCodeFormat } from "@/lib/certificate";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Certificate ${code.toUpperCase()}`,
    description: "Learn & Play PK certificate verification.",
    robots: { index: false },
  };
}

type Record = { name: string; language: string; level: number; date: string; code: string };

async function lookup(code: string): Promise<Record | null> {
  if (!isValidCodeFormat(code) || !isAdminConfigured) return null;
  try {
    const snap = await adminDb().collection("certificates").doc(code.toUpperCase()).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    return {
      name: (d.name as string) ?? "Learner",
      language: (d.language as string) ?? "",
      level: (d.level as number) ?? 0,
      date: (d.date as string) ?? "",
      code: code.toUpperCase(),
    };
  } catch {
    return null;
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rec = await lookup(code);
  const badFormat = !isValidCodeFormat(code);

  return (
    <div className="container-page page-pad flex min-h-[70dvh] items-center justify-center pb-24 pt-10">
      <div className="card w-full max-w-lg p-6 text-center sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Learn &amp; Play PK</p>
        <h1 className="mt-1 font-display text-2xl font-black text-fg">Certificate verification</h1>

        {rec ? (
          <>
            <span className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full bg-success-tint text-2xl text-success-ink">
              ✓
            </span>
            <p className="mt-4 text-sm text-muted">Yeh certificate asli hai.</p>
            <p className="mt-4 font-display text-2xl font-black text-fg">{rec.name}</p>
            <p className="mt-1 text-base font-bold text-brand-ink">
              {rec.language} — Level {rec.level}
            </p>
            <dl className="mx-auto mt-6 grid max-w-xs gap-2 text-sm">
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">Tareekh</dt>
                <dd className="font-semibold text-fg tnum">{rec.date}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">Code</dt>
                <dd className="font-semibold text-fg">{rec.code}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <span className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-2xl text-muted">
              ?
            </span>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {badFormat
                ? "Yeh code sahi format mein nahi hai. Code aise dikhta hai: LPK-XXXX-XXXX."
                : "Is code se koi certificate nahi mila. Ho sakta hai code galat likha ho — dobara check kar lein."}
            </p>
          </>
        )}

        <Link href="/" className="btn btn-secondary btn-sm mt-8">
          Home
        </Link>
      </div>
    </div>
  );
}
