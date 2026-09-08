"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";

type Status = {
  anyConfigured: boolean;
  providers: Array<{ id: string; name: string; configured: boolean; missing: string[]; mode: string }>;
  webhooksReady: boolean;
  missingWebhookVars: string[];
};

/**
 * Admin-only setup banner: says exactly which env vars are missing so payments
 * are never silently broken for users. Names only — never values.
 */
export function PaymentsBanner() {
  const [s, setS] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/payments/status")
      .then((r) => r.json())
      .then(setS)
      .catch(() => setS(null));
  }, []);

  if (!s) return null;

  const allGood = s.anyConfigured && s.webhooksReady;

  return (
    <Card className={`mb-6 p-4 ${allGood ? "" : "border-warning bg-warning-tint"}`}>
      <p className="flex items-center gap-2 font-display text-sm font-extrabold text-fg">
        {allGood ? (
          <CheckCircle2 size={16} strokeWidth={2.4} className="text-success-ink" />
        ) : (
          <AlertTriangle size={16} strokeWidth={2.4} className="text-warning-ink" />
        )}
        Payments {allGood ? "configured" : "setup adhoora hai"}
      </p>
      <ul className="mt-3 grid gap-1.5 text-xs">
        {s.providers.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2">
            <span className={p.configured ? "font-bold text-success-ink" : "font-bold text-warning-ink"}>
              {p.configured ? "✓" : "✗"} {p.name}
            </span>
            <span className="text-muted">({p.mode})</span>
            {p.missing.length > 0 && (
              <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                missing: {p.missing.join(", ")}
              </code>
            )}
          </li>
        ))}
        {s.missingWebhookVars.length > 0 && (
          <li className="text-warning-ink">
            Webhooks entitlement nahi likh sakte —{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px]">{s.missingWebhookVars.join(", ")}</code>{" "}
            set karein.
          </li>
        )}
      </ul>
      {!allGood && (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Jab tak yeh set nahi hote, /premium par checkout buttons nazar nahi aayenge — user ko toota hua button nahi
          milega. Setup steps MONETIZATION-REPORT.md mein hain.
        </p>
      )}
    </Card>
  );
}
