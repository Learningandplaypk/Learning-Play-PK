"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui";
import { usePlayer } from "@/lib/store";

/**
 * Cookie + ads consent banner (Google AdSense CMP companion).
 * Choice is persisted; ad slots only initialize after consent.
 */
export function ConsentBanner() {
  const consent = usePlayer((s) => s.consentAds);
  const setPlayer = usePlayer((s) => s.setPlayer);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consent == null) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [consent]);

  const decide = (v: boolean) => {
    setPlayer({ consentAds: v });
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-x-3 bottom-20 z-[250] mx-auto max-w-xl lg:bottom-6 lg:left-6 lg:mx-0">
      <div className="glass p-4">
        <p className="text-sm text-ink">
          Hum cookies use karte hain taake games yaad rakhein aur ads dikhayein.{" "}
          <a href="/privacy" className="text-electric underline underline-offset-2">
            Privacy Policy
          </a>
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => decide(true)}>
            Theek hai, accept
          </Button>
          <Button size="sm" variant="ghost" onClick={() => decide(false)}>
            Sirf zaroori
          </Button>
        </div>
      </div>
    </div>
  );
}
