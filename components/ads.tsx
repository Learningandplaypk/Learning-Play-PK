"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/store";
import { Button } from "./ui";

/**
 * Real Google AdSense integration.
 * - <AdSlot/> renders a responsive display unit; the AdSense script is injected lazily
 *   AFTER user consent and only outside gameplay canvases.
 * - <RewardedAdButton/> wires the AdSense H5 Games Ads SDK (afg.js) adBreak() reward flow
 *   ("Watch ad → +1 heart") and hides itself gracefully when unconfigured or unfilled.
 */

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
const REWARDED_SLOT = process.env.NEXT_PUBLIC_ADSENSE_REWARDED_SLOT ?? "";

let scriptInjected = false;
function injectAdSense() {
  if (scriptInjected || !CLIENT || typeof window === "undefined") return;
  scriptInjected = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

export function AdSlot({ slot, className, label = "Advertisement" }: { slot?: string; className?: string; label?: string }) {
  const consent = usePlayer((s) => s.consentAds);
  const premium = usePlayer((s) => s.premium);
  const ref = useRef<HTMLModElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!slot || !CLIENT || premium) return;
    if (consent !== true) return;
    // lazy: only request an ad when the slot is near the viewport
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && setVisible(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [slot, consent, premium]);

  useEffect(() => {
    if (!visible || !ref.current) return;
    injectAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ad-blocker — hide gracefully */
    }
  }, [visible]);

  if (!slot || !CLIENT || premium || consent !== true) return null;
  return (
    <div className={className} aria-label={label}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    adBreak?: (config: Record<string, unknown>) => void;
    adConfig?: (config: Record<string, unknown>) => void;
  }
}

function loadH5GamesSdk(cb: () => void) {
  if (window.adBreak) return cb();
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://pagead2.googlesyndication.com/pagead/js/afg.js";
  s.onload = () => {
    window.adConfig?.({ client: CLIENT, enablePreload: true });
    cb();
  };
  s.onerror = cb;
  document.head.appendChild(s);
}

export function RewardedAdButton({ onReward, label = "📺 Ad dekho → +1 ❤️" }: { onReward: () => void; label?: string }) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CLIENT || !REWARDED_SLOT) return;
    loadH5GamesSdk(() => setAvailable(!!window.adBreak));
  }, []);

  const watch = () => {
    setBusy(true);
    let rewarded = false;
    window.adBreak?.({
      type: "reward",
      adBreakId: "rewarded-heart",
      configurations: { adSlot: REWARDED_SLOT },
      adViewed: () => {
        rewarded = true;
        onReward();
      },
      adDismissed: () => {
        if (!rewarded) setBusy(false);
      },
      adCompleted: () => setBusy(false),
    });
    // if no fill / SDK absent, the button simply does nothing further — UI resets
    setTimeout(() => setBusy(false), 8000);
  };

  if (!available) return null;
  return (
    <Button size="sm" variant="ghost" onClick={watch} disabled={busy}>
      {busy ? "Ad chal raha hai…" : label}
    </Button>
  );
}
