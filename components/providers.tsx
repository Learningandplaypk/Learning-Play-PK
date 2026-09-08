"use client";

import React, { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { ToastHost } from "./toast";
import { LevelUpHost } from "./levelup";
import { ConsentBanner } from "./consent";
import { InstallPrompt } from "./install-prompt";
import { setSfxEnabled } from "@/lib/sfx";
import { usePlayer } from "@/lib/store";
import { themeVars } from "@/lib/cosmetics";

function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

/** Applies the premium theme skin (CSS variables) to the document root. */
function CosmeticsSync() {
  const skin = usePlayer((s) => s.themeSkin);
  const premium = usePlayer((s) => s.premium);
  useEffect(() => {
    const vars = themeVars(skin, premium) as Record<string, string>;
    const root = document.documentElement;
    const applied = Object.keys(vars);
    applied.forEach((k) => root.style.setProperty(k, vars[k]));
    return () => applied.forEach((k) => root.style.removeProperty(k));
  }, [skin, premium]);
  return null;
}

function SoundSync() {
  const sound = usePlayer((s) => s.sound);
  useEffect(() => setSfxEnabled(sound), [sound]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Zustand persist is configured with skipHydration — rehydrate AFTER first paint
  // so server HTML and client HTML match (no hydration mismatch).
  useEffect(() => {
    void usePlayer.persist.rehydrate();
  }, []);
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <SoundSync />
          <CosmeticsSync />
          <ServiceWorker />
          {children}
          <ToastHost />
          <LevelUpHost />
          <ConsentBanner />
          <InstallPrompt />
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
