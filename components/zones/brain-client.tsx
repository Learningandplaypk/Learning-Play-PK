"use client";

import React from "react";
import { ZoneGrid, ZoneHeader } from "@/components/zone-grid";
import { BRAIN_GAME_DATA } from "@/lib/games-data";
import { AdSlot } from "@/components/ads";

export function BrainClient() {
  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-6xl pb-28 pt-28">
      <ZoneHeader emoji="🧠" title="Brain Zone" urdu="دماغ زون" desc="10 dimaagi games — memory, logic, speed aur strategy. Roz khelo, dimaag tez karo." />
      <ZoneGrid games={BRAIN_GAME_DATA} basePath="/brain" />
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BRAIN} className="mx-auto mt-10 max-w-2xl" />
    </div>
  );
}
