"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { captureException } from "@/lib/observability";

/** Route-level error boundary — one client crash shows this instead of a blank screen. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { boundary: "app/error.tsx", digest: error.digest ?? "" });
  }, [error]);

  return (
    <div className="page-pad mx-auto grid min-h-[80dvh] max-w-xl place-items-center text-center">
      <div className="glass w-full p-8">
        <div className="mx-auto mb-4 grid h-16 w-16 animate-float place-items-center rounded-3xl bg-gradient-to-br from-pink-accent/50 to-neon-orange/50 text-3xl">🛠️</div>
        <h1 className="font-display text-2xl font-black">
          <span className="text-gradient">Arre! Kuch toot gaya</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Game load hote waqt masla hua. Ghabrao nahi — progress mehfooz hai. Dobara koshish karo.
        </p>
        {error.digest && <p className="mt-2 font-mono text-[10px] text-muted/60">ref: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn btn-neon btn-sm">
            🔄 Dobara koshish
          </button>
          <Link href="/" className="btn btn-ghost btn-sm">
            🏠 Home
          </Link>
        </div>
      </div>
    </div>
  );
}
