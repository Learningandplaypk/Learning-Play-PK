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
    <html lang="en" data-theme="light">
      <body
        style={{
          background: "#FAFAF7",
          color: "#1C1C1A",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #E6E6E0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            }}
          >
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", fontFamily: "system-ui" }}>
              Application error
            </h1>
            <p style={{ fontSize: 14, color: "#6B6B66", lineHeight: 1.6, margin: 0 }}>
              Aik serious masla hua — page reload karein. Aapka progress browser mein mehfooz hai.
              {error.digest ? ` (ref: ${error.digest})` : ""}
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 18,
                background: "#15804F",
                color: "#fff",
                border: 0,
                borderRadius: 12,
                padding: "12px 22px",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 4px 0 0 #0E5C3B",
              }}
            >
              Reload karein
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
