"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { captureException } from "@/lib/observability";
import { Ustad } from "@/components/brand/ustad";

/** Route-level error boundary — one client crash shows this instead of a blank screen. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { boundary: "app/error.tsx", digest: error.digest ?? "" });
  }, [error]);

  return (
    <div className="page-pad container-page flex min-h-[80dvh] max-w-md flex-col justify-center pb-24 pt-8">
      <div className="card p-6 sm:p-8">
        <Ustad mood="sad" className="h-20 w-20" />
        <h1 className="mt-4 font-display text-2xl font-black text-fg">Arre! Kuch toot gaya</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Game load hote waqt masla hua. Ghabrao nahi — progress mehfooz hai. Dobara koshish karo.
        </p>
        {error.digest && <p className="mt-2 font-mono text-[10px] text-muted">ref: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw size={17} strokeWidth={2.3} /> Dobara koshish
          </button>
          <Link href="/" className="btn btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
