"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { SceneBoundary } from "@/components/scene-boundary";
import { Ustad } from "@/components/brand/ustad";
import { useAfterLoad, useRichUI } from "@/lib/perf";
import { HeroStill } from "./hero-still";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

/**
 * Adaptive hero: static illustration by default / on mobile / lite / reduced-motion;
 * the 3D globe loads only when richUI is on, after LCP.
 */
export function HeroVisual() {
  const rich = useRichUI();
  const afterLoad = useAfterLoad();
  const [failed, setFailed] = useState(false);
  const show3d = rich && afterLoad && !failed;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]" data-parallax="-28">
      {!show3d && <HeroStill />}
      {show3d && (
        <SceneBoundary
          name="home-hero"
          fallback={<HeroStill />}
        >
          <div
            className="h-full w-full"
            onError={() => setFailed(true)}
          >
            <HeroScene className="h-full w-full" />
          </div>
          <div className="pointer-events-none absolute -bottom-2 -end-2 w-24 sm:w-28">
            <Ustad mood="happy" className="h-full w-full" />
          </div>
        </SceneBoundary>
      )}
    </div>
  );
}
