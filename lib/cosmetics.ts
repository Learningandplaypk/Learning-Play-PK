/**
 * Premium cosmetics — 6 avatars, 3 frames, 2 themes.
 *
 * Everything here is pure decoration: no cosmetic changes gameplay, XP, coins
 * or ranking. Colours come from the existing design tokens (no neon).
 */

export type Cosmetic = { id: string; name: string; premium: boolean };

export type PremiumAvatar = Cosmetic & { emoji: string };
export type Frame = Cosmetic & {
  /** CSS values built from design tokens only. */
  ring: string;
  glow?: string;
};
export type ThemeSkin = Cosmetic & { desc: string; vars: Record<string, string> };

/* ------------------------------- avatars -------------------------------- */

export const PREMIUM_AVATARS: PremiumAvatar[] = [
  { id: "falcon", name: "Shaheen", emoji: "🦅", premium: true },
  { id: "markhor", name: "Markhor", emoji: "🐐", premium: true },
  { id: "snowleopard", name: "Barfani Cheeta", emoji: "🐆", premium: true },
  { id: "peacock", name: "Mor", emoji: "🦚", premium: true },
  { id: "camel", name: "Oont", emoji: "🐫", premium: true },
  { id: "dolphin", name: "Indus Dolphin", emoji: "🐬", premium: true },
];

/* -------------------------------- frames -------------------------------- */

export const FRAMES: Frame[] = [
  { id: "none", name: "Koi frame nahi", premium: false, ring: "2px solid var(--border)" },
  {
    id: "gold",
    name: "Sunehri",
    premium: true,
    ring: "3px solid var(--accent)",
    glow: "0 0 0 4px var(--accent-tint)",
  },
  {
    id: "emerald",
    name: "Zumurrud",
    premium: true,
    ring: "3px solid var(--brand-solid)",
    glow: "0 0 0 4px var(--brand-tint)",
  },
  {
    id: "truck-art",
    name: "Truck Art",
    premium: true,
    ring: "3px dashed var(--accent-edge)",
    glow: "0 0 0 4px var(--accent-tint)",
  },
];

export const PREMIUM_FRAMES = FRAMES.filter((f) => f.premium);

/* -------------------------------- themes -------------------------------- */

/**
 * Two premium theme skins. They only re-point existing tokens — soft, readable,
 * AA-contrast, and deliberately not neon.
 */
export const THEME_SKINS: ThemeSkin[] = [
  {
    id: "default",
    name: "Default",
    desc: "Learn & Play PK ka asal look",
    premium: false,
    vars: {},
  },
  {
    id: "chinar",
    name: "Chinar",
    desc: "Khazan ke patton wale garam rang",
    premium: true,
    vars: {
      "--brand": "#a2542a",
      "--brand-hover": "#8a4622",
      "--brand-pressed": "#71391b",
      "--brand-ink": "#8a4622",
      "--brand-solid": "#9a4e27",
      "--brand-edge": "#71391b",
      "--brand-tint": "#f6ece5",
    },
  },
  {
    id: "indigo-truck",
    name: "Indigo",
    desc: "Thanda neela — raat ko parhne ke liye",
    premium: true,
    vars: {
      "--brand": "#3552a4",
      "--brand-hover": "#2c458c",
      "--brand-pressed": "#233872",
      "--brand-ink": "#2c458c",
      "--brand-solid": "#314d9b",
      "--brand-edge": "#233872",
      "--brand-tint": "#e8ecf7",
    },
  },
];

export const PREMIUM_THEMES = THEME_SKINS.filter((t) => t.premium);

/* ------------------------------- helpers -------------------------------- */

export function frameById(id: string | null | undefined): Frame {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0];
}

export function themeSkinById(id: string | null | undefined): ThemeSkin {
  return THEME_SKINS.find((t) => t.id === id) ?? THEME_SKINS[0];
}

/** A cosmetic is usable only while premium is active (non-premium falls back). */
export function resolveCosmetic<T extends Cosmetic>(list: T[], id: string | null | undefined, premium: boolean, fallback: T): T {
  const found = list.find((c) => c.id === id);
  if (!found) return fallback;
  if (found.premium && !premium) return fallback;
  return found;
}

/** Inline style object for the CSS variables of a theme skin. */
export function themeVars(id: string | null | undefined, premium: boolean): React.CSSProperties {
  const skin = themeSkinById(id);
  if (skin.premium && !premium) return {};
  return skin.vars as React.CSSProperties;
}

export const COSMETIC_COUNTS = {
  avatars: PREMIUM_AVATARS.length,
  frames: PREMIUM_FRAMES.length,
  themes: PREMIUM_THEMES.length,
};
