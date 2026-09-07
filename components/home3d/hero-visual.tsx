"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { SceneBoundary } from "@/components/scene-boundary";
import { GlobeArt } from "@/components/brand/globe";
import { Ustad } from "@/components/brand/ustad";
import { useAfterLoad, usePerfTier } from "@/lib/perf";

// The only WebGL in the app: lazy chunk, client-only, mounted after LCP.
const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

function StaticHero() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <GlobeArt className="h-full w-full" />
      <div className="absolute -bottom-2 -right-2 w-24 drop-shadow-md sm:w-28">
        <Ustad mood="happy" className="h-full w-full" />
      </div>
    </div>
  );
}

/**
 * Adaptive hero: static flat illustration by default and on low-end devices;
 * the 3D globe only loads when the device can take it and the user hasn't
 * switched Lite mode on.
 */
export function HeroVisual() {
  const { tier, probed } = usePerfTier();
  const afterLoad = useAfterLoad();
  const [failed, setFailed] = useState(false);
  const show3d = tier === "high" && probed && afterLoad && !failed;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      {/* static layer is what everyone gets first (also the 3D fallback) */}
      {!show3d && <StaticHero />}
      {show3d && (
        <SceneBoundary name="home-hero" fallback={<StaticHero />}>
          <HeroScene className="h-full w-full" />
          <div className="pointer-events-none absolute -bottom-2 -right-2 w-24 sm:w-28">
            <Ustad mood="happy" className="h-full w-full" />
          </div>
        </SceneBoundary>
      )}
    </div>
  );
}
