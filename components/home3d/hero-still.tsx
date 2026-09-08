import React from "react";
import { GlobeArt } from "@/components/brand/globe";
import { Ustad } from "@/components/brand/ustad";

/** Designed static stand-in for the 3D hero (mobile / lite / reduced motion). */
export function HeroStill() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <GlobeArt className="h-full w-full" />
      {/* floating letters */}
      <span className="absolute start-[8%] top-[14%] font-display text-2xl font-black text-brand-ink" aria-hidden>
        A
      </span>
      <span className="absolute end-[10%] top-[18%] font-display text-2xl font-black text-brand-ink" aria-hidden>
        ب
      </span>
      <span className="absolute start-[6%] bottom-[28%] font-display text-xl font-black text-accent-ink" aria-hidden>
        한
      </span>
      <span className="absolute end-[8%] bottom-[30%] font-display text-xl font-black text-brand-ink" aria-hidden>
        あ
      </span>
      <span className="absolute left-1/2 top-[4%] -translate-x-1/2 font-display text-xl font-black text-brand-ink" aria-hidden>
        中
      </span>
      {/* book */}
      <svg viewBox="0 0 48 36" className="absolute bottom-[18%] start-[4%] h-10 w-12" aria-hidden>
        <path d="M4 8h18v22H8c-2 0-4-2-4-4z" fill="#178A55" />
        <path d="M26 8h18v18c0 2-2 4-4 4H26z" fill="#0E5C3B" />
        <path d="M24 8v22" stroke="#FDF6E9" strokeWidth="2" />
      </svg>
      {/* controller */}
      <svg viewBox="0 0 56 32" className="absolute bottom-[16%] end-[2%] h-8 w-14" aria-hidden>
        <rect x="2" y="8" width="52" height="18" rx="9" fill="#1C1C1A" />
        <circle cx="16" cy="17" r="4" fill="#F5A524" />
        <circle cx="40" cy="17" r="4" fill="#178A55" />
      </svg>
      <div className="absolute -bottom-2 -end-2 w-24 drop-shadow-md sm:w-28">
        <Ustad mood="happy" className="h-full w-full" />
      </div>
    </div>
  );
}
