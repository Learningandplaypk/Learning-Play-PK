"use client";

import React from "react";
import { X } from "lucide-react";
import { usePlayer } from "@/lib/store";

export function ToastHost() {
  const toasts = usePlayer((s) => s.toasts);
  const dismiss = usePlayer((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed inset-x-3 z-[300] flex flex-col items-center gap-2 sm:inset-x-auto sm:left-4 sm:items-start"
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))" }}
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="card-md anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3"
        >
            <span className="text-xl leading-none" aria-hidden>
              {t.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug text-fg">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs leading-snug text-muted">{t.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            >
              <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      ))}
    </div>
  );
}
