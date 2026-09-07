"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { LogoMark } from "./brand/ustad";

const DISMISS_KEY = "lpk-install-dismiss";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < SEVEN_DAYS;
  } catch {
    return false;
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Custom install prompt (Android/Chrome) + iOS "Add to Home Screen" hint. */
export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || recentlyDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|android/i.test(ua);
    if (isIos && isSafari) setIos(true);

    const t = setTimeout(() => setVisible(true), 6000);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice?.catch(() => {});
    dismiss();
  };

  const show = visible && (prompt || ios);
  if (!show) return null;

  return (
    <div
      className="anim-dialog fixed inset-x-3 z-[280] mx-auto max-w-sm lg:inset-x-auto lg:right-4 lg:mx-0"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        role="dialog"
        aria-label="Install Learn & Play PK"
      >
        <div className="card-md flex items-start gap-3 p-4">
          <LogoMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold text-fg">App install karo — offline bhi chalega</p>
            {ios ? (
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Safari ke <Share size={12} className="inline align-[-2px]" strokeWidth={2.4} /> share menu se{" "}
                <b className="text-fg">&quot;Add to Home Screen&quot;</b> chuno.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Home screen par icon lagao — bina internet ke bhi games chalte hain.
              </p>
            )}
            {prompt && (
              <button type="button" onClick={install} className="btn btn-primary btn-sm mt-3">
                <Download size={16} strokeWidth={2.4} /> Install karo
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
    </div>
  );
}
