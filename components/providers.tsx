"use client";

import React, { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { ToastHost } from "./toast";
import { LevelUpHost } from "./levelup";
import { CustomCursor } from "./cursor";
import { ConsentBanner } from "./consent";
import { setSfxEnabled } from "@/lib/sfx";
import { usePlayer } from "@/lib/store";

function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

function SoundSync() {
  const sound = usePlayer((s) => s.sound);
  useEffect(() => setSfxEnabled(sound), [sound]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <SoundSync />
        <ServiceWorker />
        {children}
        <ToastHost />
        <LevelUpHost />
        <CustomCursor />
        <ConsentBanner />
      </AuthProvider>
    </I18nProvider>
  );
}
