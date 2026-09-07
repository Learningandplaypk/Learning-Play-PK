"use client";

import React from "react";
import { GameCatalog } from "@/components/zone-grid";
import { BRAIN_GAME_DATA } from "@/lib/games-data";
import { AdSlot } from "@/components/ads";

export function BrainClient() {
  return (
    <GameCatalog
      games={BRAIN_GAME_DATA}
      basePath="/brain"
      zone="brain"
      title="Brain Zone"
      urdu="دماغ زون"
      desc="10 dimaagi games — memory, logic, speed aur strategy. Roz khelo, dimaag tez karo."
    >
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BRAIN || undefined} className="mx-auto mt-10 max-w-2xl" />
    </GameCatalog>
  );
}
