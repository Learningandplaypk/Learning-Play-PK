"use client";

import React from "react";
import { usePlayer } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";

export function ToastHost() {
  const toasts = usePlayer((s) => s.toasts);
  const dismiss = usePlayer((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[300] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 lg:bottom-8 lg:left-8 lg:translate-x-0">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            onClick={() => dismiss(t.id)}
            className="glass pointer-events-auto glow-ring flex items-center gap-3 px-4 py-3 text-left"
          >
            <span className="text-2xl" aria-hidden>
              {t.emoji}
            </span>
            <span>
              <span className="block font-display text-sm font-bold text-ink">{t.title}</span>
              {t.body && <span className="block text-xs text-muted">{t.body}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
