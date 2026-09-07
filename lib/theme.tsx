"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "learnplay-theme";

/**
 * Runs before first paint (inline in the document) so the correct theme is
 * applied without a flash. Kept tiny + dependency free.
 */
export const themeBootstrapScript = `(function(){try{var k=localStorage.getItem("${STORAGE_KEY}")||"system";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=k==="system"?(d?"dark":"light"):k;document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

type ThemeCtx = {
  choice: ThemeChoice;
  theme: ResolvedTheme;
  setChoice: (c: ThemeChoice) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx>({
  choice: "system",
  theme: "light",
  setChoice: () => {},
  toggle: () => {},
});

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  const apply = useCallback((c: ThemeChoice) => {
    const resolved = c === "system" ? systemTheme() : c;
    setTheme(resolved);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
    }
  }, []);

  useEffect(() => {
    let saved: ThemeChoice = "system";
    try {
      const raw = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
      if (raw === "light" || raw === "dark" || raw === "system") saved = raw;
    } catch {
      /* storage unavailable */
    }
    setChoiceState(saved);
    apply(saved);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) ?? "system") === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  const setChoice = useCallback(
    (c: ThemeChoice) => {
      setChoiceState(c);
      try {
        localStorage.setItem(STORAGE_KEY, c);
      } catch {
        /* storage unavailable */
      }
      apply(c);
    },
    [apply]
  );

  const toggle = useCallback(() => setChoice(theme === "dark" ? "light" : "dark"), [theme, setChoice]);

  return <Ctx.Provider value={{ choice, theme, setChoice, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
