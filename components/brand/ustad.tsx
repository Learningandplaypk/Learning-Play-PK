import React from "react";

/* ---------------------------------------------------------------------------
   "Ustad" — the Learn & Play PK mascot.
   One flat illustration, two brand tones + cream + saffron, used everywhere
   (empty states, level-up, game-over, onboarding, hero). Fixed colours so it
   reads identically in light and dark mode.
--------------------------------------------------------------------------- */

const GREEN = "#178A55";
const GREEN_DARK = "#0E5C3B";
const CREAM = "#FDF6E9";
const SAFFRON = "#F5A524";
const INK = "#1C1C1A";

export type UstadMood = "happy" | "celebrate" | "sad" | "think";

export function Ustad({
  className,
  mood = "happy",
  title = "Ustad, the Learn & Play PK owl",
}: {
  className?: string;
  mood?: UstadMood;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 120 130" className={className} role="img" aria-label={title}>
      {/* ear tufts */}
      <path d="M34 34 L28 8 L52 22 Z" fill={GREEN_DARK} />
      <path d="M86 34 L92 8 L68 22 Z" fill={GREEN_DARK} />
      {/* body */}
      <path
        d="M60 22c22 0 36 15 36 36 0 30-16 52-36 52S24 88 24 58c0-21 14-36 36-36z"
        fill={GREEN}
      />
      {/* wings */}
      <path d="M27 62c-6 12-4 28 6 38 4-14 3-28-6-38z" fill={GREEN_DARK} />
      <path d="M93 62c6 12 4 28-6 38-4-14-3-28 6-38z" fill={GREEN_DARK} />
      {/* belly */}
      <ellipse cx="60" cy="84" rx="21" ry="24" fill={CREAM} />
      {/* face disc */}
      <ellipse cx="60" cy="54" rx="27" ry="23" fill={CREAM} />
      {/* eyes */}
      <circle cx="48" cy="52" r="10" fill="#FFFFFF" />
      <circle cx="72" cy="52" r="10" fill="#FFFFFF" />
      {mood === "sad" ? (
        <>
          <path d="M42 47l8 4M54 47l-8 4" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M66 51l8-4M74 51l-8-4" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="49" cy="53" r="4.5" fill={INK} />
          <circle cx="71" cy="53" r="4.5" fill={INK} />
          <circle cx="50.5" cy="51.5" r="1.4" fill="#FFFFFF" />
          <circle cx="72.5" cy="51.5" r="1.4" fill="#FFFFFF" />
        </>
      )}
      {/* beak */}
      <path d="M60 60l-7 11h14z" fill={SAFFRON} />
      {/* feet */}
      <path d="M48 108l-7 12 7 3 4-12z" fill={SAFFRON} />
      <path d="M72 108l7 12-7 3-4-12z" fill={SAFFRON} />
      {mood === "celebrate" && (
        <>
          <path d="M18 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={SAFFRON} />
          <path d="M104 40l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={SAFFRON} />
          <path d="M96 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={SAFFRON} />
        </>
      )}
      {mood === "think" && (
        <path d="M84 30c8-6 16-2 14 5-2 6-12 6-16 1" stroke={SAFFRON} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Compact owl mark for the nav bar / favicon area. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="10" fill={GREEN} />
      <path d="M9 12l-2.5-7L15 9z" fill={GREEN_DARK} />
      <path d="M31 12l2.5-7L25 9z" fill={GREEN_DARK} />
      <path d="M20 11c7 0 11 5 11 11.5S27 33 20 33s-11-4.5-11-10.5S13 11 20 11z" fill={GREEN} />
      <ellipse cx="20" cy="19" rx="9.5" ry="8" fill={CREAM} />
      <circle cx="16.4" cy="18.4" r="3.4" fill="#FFFFFF" />
      <circle cx="23.6" cy="18.4" r="3.4" fill="#FFFFFF" />
      <circle cx="16.8" cy="18.8" r="1.7" fill={INK} />
      <circle cx="23.2" cy="18.8" r="1.7" fill={INK} />
      <path d="M20 21.5l-2.4 3.6h4.8z" fill={SAFFRON} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Zone illustrations — flat, 2-colour, same stroke language as the mascot.
--------------------------------------------------------------------------- */

export type ZoneKey = "learn" | "brain" | "quiz" | "fun";

const ZONE_ART: Record<ZoneKey, React.ReactNode> = {
  learn: (
    <>
      <path d="M14 26c6-3 12-3 18 0v30c-6-3-12-3-18 0z" fill={GREEN} />
      <path d="M34 26c6-3 12-3 18 0v30c-6-3-12-3-18 0z" fill={GREEN_DARK} />
      <path d="M32 26v30" stroke={CREAM} strokeWidth="2" />
      <path d="M20 34h8M20 40h8M40 34h8M40 40h8" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M43 14l1.8 3.8L49 19l-4.2 1.2L43 24l-1.8-3.8L37 19l4.2-1.2z" fill={SAFFRON} />
    </>
  ),
  brain: (
    <>
      <path
        d="M32 16c-7 0-13 4-13 11 0 2 .6 3.8 1.6 5.4C15 34 13 37.6 13 42c0 6.6 5.4 12 12 12 2 0 3.8-.5 5.4-1.4C32.6 55.6 35.8 57 39.6 57c6.8 0 12.4-5 12.4-11.6 0-2.6-.9-5-2.4-7 2.6-1.4 4.4-4 4.4-7C54 24 45 16 32 16z"
        fill={GREEN}
      />
      <path
        d="M36 22c-4 3-6 8-4 13 1.6 4 0 7-3 9 3 2 5 6 4 10"
        stroke={CREAM}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="24" cy="30" r="3.4" fill={SAFFRON} />
      <circle cx="45" cy="41" r="4" fill={SAFFRON} />
      <circle cx="28" cy="47" r="2.6" fill={SAFFRON} />
    </>
  ),
  quiz: (
    <>
      <path d="M12 20h44v26c0 4-3 7-7 7H25l-9 7v-7h-4z" fill={GREEN} />
      <path d="M25 28h18M25 36h12" stroke={CREAM} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="50" cy="50" r="9" fill={SAFFRON} />
      <path
        d="M47 47c0-2.2 1.4-3.6 3-3.6s3 1.4 3 3.2c0 1.6-1.4 2.4-3 3.4-1.4.8-2 1.6-2 2.8"
        stroke={INK}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="50" cy="55" r="1.3" fill={INK} />
    </>
  ),
  fun: (
    <>
      <path
        d="M18 26h32c5.5 0 10 4.5 10 10v4c0 4.5-3.7 8.2-8.2 8.2-1.2 3.5-4.5 6-8.4 6-3.4 0-6.4-1.9-8-4.7L31 46H26l-5 3.5C19.4 52.3 16.4 54.2 13 54.2c-3.9 0-7.2-2.5-8.4-6C2.7 46.4 0 43 0 38.5v-2.5C0 30.5 4.5 26 10 26z"
        fill={GREEN}
      />
      <circle cx="12" cy="38" r="4.4" fill={CREAM} />
      <path d="M27 33h10M32 28v10" stroke={CREAM} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="45" cy="34" r="3" fill={SAFFRON} />
      <circle cx="51" cy="41" r="3" fill={SAFFRON} />
      <circle cx="39" cy="42" r="3" fill={CREAM} />
    </>
  ),
};

export function ZoneArt({ zone, className }: { zone: ZoneKey; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {ZONE_ART[zone]}
    </svg>
  );
}

/** Tinted tile that hosts a zone illustration — used on cards and catalogs. */
export function ZoneBadge({ zone, className }: { zone: ZoneKey; className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        background: "var(--brand-tint)",
      }}
    >
      <ZoneArt zone={zone} className="h-3/5 w-3/5" />
    </span>
  );
}
