"use client";

import React from "react";
import { GameCatalog } from "@/components/zone-grid";
import { FUN_GAME_DATA } from "@/lib/games-data";
import { AdSlot } from "@/components/ads";

export function FunClient() {
  return (
    <GameCatalog
      games={FUN_GAME_DATA}
      basePath="/fun"
      zone="fun"
      title="Fun Zone"
      urdu="مستی زون"
      desc="15 arcade classics — Snake, Tetris, Racing, Fruit Ninja aur mazeed. Sab touch-friendly, sab free."
    >
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FUN || undefined} className="mx-auto mt-10 max-w-2xl" />
    </GameCatalog>
  );
}
