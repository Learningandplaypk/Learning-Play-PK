"use client";

import React, { useEffect } from "react";
import { captureException } from "@/lib/observability";

/**
 * Global error boundary — fires when even the root layout throws.
 * Must render its own <html>/<body> (no layout applies here).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { boundary: "app/global-error.tsx", digest: error.digest ?? "" });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#05060F", color: "#F4F6FF", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: "80dvh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 44 }}>🛠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 8px" }}>Application error</h1>
            <p style={{ fontSize: 13, color: "#8B90B0", lineHeight: 1.6 }}>
              Aik serious masla hua — page reload karein. Aapka progress browser mein mehfooz hai.
              {error.digest ? ` (ref: ${error.digest})` : ""}
            </p>
            <button
              onClick={reset}
              style={{ marginTop: 18, background: "linear-gradient(90deg,#39FF14,#2D7CFF)", color: "#05060F", border: 0, borderRadius: 12, padding: "10px 22px", fontWeight: 800, cursor: "pointer" }}
            >
              Reload karein
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
