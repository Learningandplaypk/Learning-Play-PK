"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "./store";

export type PerfTier = "low" | "high";

type Nav = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/** Cheap static signals: RAM, cores, Save-Data, coarse pointer, small viewport. */
export function deviceLooksLowEnd(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Nav;
  const mem = typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
  if (mem !== undefined && mem <= 4) return true;
  if (nav.connection?.saveData) return true;
  const cores = nav.hardwareConcurrency ?? 8;
  if (cores <= 4) return true;
  if (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 480) return true;
  return false;
}

/**
 * 1 second FPS probe, run once per session after the page is interactive.
 * Anything under 40fps is treated as a low-end device.
 */
export function probeFps(): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      frames += 1;
      const elapsed = performance.now() - start;
      if (elapsed >= 1000) {
        cancelAnimationFrame(raf);
        resolve(Math.round((frames * 1000) / elapsed));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
}

/**
 * Resolves the rendering tier:
 *  - "low"  → static SVG illustrations everywhere (Lite mode, Save-Data, ≤4GB RAM, <40fps)
 *  - "high" → the single lazy hero canvas is allowed
 */
export function usePerfTier(): { tier: PerfTier; probed: boolean } {
  const lite = usePlayer((s) => s.lowQuality); // persisted "Lite mode" setting
  const [staticLow, setStaticLow] = useState(false);
  const [probed, setProbed] = useState(false);

  useEffect(() => {
    if (lite || deviceLooksLowEnd()) {
      setStaticLow(true);
      setProbed(true);
      return;
    }
    let alive = true;
    const id = window.setTimeout(() => {
      void probeFps().then((fps) => {
        if (!alive) return;
        if (fps < 40) setStaticLow(true);
        setProbed(true);
      });
    }, 1200);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [lite]);

  return { tier: lite || staticLow ? "low" : "high", probed };
}

/** Mount heavy/optional things only after LCP so first load stays ≤200KB gz. */
export function useAfterLoad(delay = 300) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const schedule = (cb: () => void) => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback;
      if (typeof ric === "function") ric(cb, { timeout: 2000 });
      else window.setTimeout(cb, delay);
    };
    if (document.readyState === "complete") {
      schedule(() => setReady(true));
      return;
    }
    const onLoad = () => schedule(() => setReady(true));
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [delay]);
  return ready;
}
