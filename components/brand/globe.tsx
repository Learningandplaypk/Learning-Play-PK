import React from "react";

/** Flat SVG globe used whenever the 3D hero is not mounted (Lite mode / low-end). */
export function GlobeArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Duniya — Learn & Play PK">
      <circle cx="100" cy="100" r="78" fill="#E6F4EC" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#178A55" strokeWidth="3" />
      {/* meridians */}
      <ellipse cx="100" cy="100" rx="30" ry="78" fill="none" stroke="#178A55" strokeWidth="2" opacity="0.55" />
      <ellipse cx="100" cy="100" rx="58" ry="78" fill="none" stroke="#178A55" strokeWidth="2" opacity="0.35" />
      <path d="M22 100h156" stroke="#178A55" strokeWidth="2" opacity="0.55" />
      <path d="M34 62h132M34 138h132" stroke="#178A55" strokeWidth="2" opacity="0.28" />
      {/* landmasses (abstract) */}
      <path
        d="M58 62c14-8 30-4 34 8s-8 22-22 22-24-8-24-16 2-9 12-14z"
        fill="#178A55"
        opacity="0.9"
      />
      <path d="M104 112c16-6 34 2 38 16s-12 26-28 22-24-14-22-24 2-11 12-14z" fill="#178A55" opacity="0.9" />
      <path d="M132 52c10-3 20 4 20 14s-10 16-18 12-8-22-2-26z" fill="#0E5C3B" opacity="0.85" />
      <path d="M64 130c8-2 14 6 12 14s-12 12-18 8-2-20 6-22z" fill="#0E5C3B" opacity="0.85" />
      {/* Pakistan marker */}
      <circle cx="118" cy="96" r="7" fill="#F5A524" />
      <circle cx="118" cy="96" r="12" fill="none" stroke="#F5A524" strokeWidth="2" opacity="0.6" />
      {/* badge */}
      <path d="M100 178v10M88 186h24" stroke="#0E5C3B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
