"use client";

import React from "react";
import { ZoneGrid, ZoneHeader } from "@/components/zone-grid";
import { FUN_GAME_DATA } from "@/lib/games-data";
import { AdSlot } from "@/components/ads";

export function FunClient() {
  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-6xl pb-28 pt-28">
      <ZoneHeader emoji="🎮" title="Fun Zone" urdu="مستی زون" desc="15 arcade classics — Snake 3D, Tetris, Racing, Fruit Ninja aur mazeed. Sab touch-friendly, sab free." />
      <ZoneGrid games={FUN_GAME_DATA} basePath="/fun" />
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FUN} className="mx-auto mt-10 max-w-2xl" />
    </div>
  );
}
