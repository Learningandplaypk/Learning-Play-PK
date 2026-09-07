"use client";

import { useTheme } from "./theme";

/** Canvas games can't read CSS variables, so the palette is mirrored here. */
export type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  brand: string;
  brandDark: string;
  accent: string;
  info: string;
  danger: string;
  purple: string;
  grid: string;
};

export const PALETTE_LIGHT: Palette = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  surface2: "#F3F3EE",
  border: "#E6E6E0",
  text: "#1C1C1A",
  muted: "#6B6B66",
  brand: "#178A55",
  brandDark: "#0E5C3B",
  accent: "#F5A524",
  info: "#2563EB",
  danger: "#D7263D",
  purple: "#7C3AED",
  grid: "#E6E6E0",
};

export const PALETTE_DARK: Palette = {
  bg: "#15171B",
  surface: "#1D2026",
  surface2: "#252932",
  border: "#2F3340",
  text: "#F2F2EE",
  muted: "#9A9CA4",
  brand: "#178A55",
  brandDark: "#0E5C3B",
  accent: "#F5A524",
  info: "#2563EB",
  danger: "#D7263D",
  purple: "#A78BFA",
  grid: "#2F3340",
};

export function usePalette(): Palette {
  const { theme } = useTheme();
  return theme === "dark" ? PALETTE_DARK : PALETTE_LIGHT;
}

/** Set up a canvas for the device pixel ratio and return a scaled 2D context. */
export function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
