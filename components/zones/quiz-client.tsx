"use client";

import React from "react";
import Link from "next/link";
import { ZoneGrid, ZoneHeader } from "@/components/zone-grid";
import { QUIZ_TOPIC_DATA } from "@/lib/games-data";
import { TiltCard } from "@/components/ui";
import { AdSlot } from "@/components/ads";

export function QuizClient() {
  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-6xl pb-28 pt-28">
      <ZoneHeader emoji="❓" title="Quiz Zone" urdu="کوئز زون" desc="10 topics — timer, streak bonus aur har jawab ki wazahat. Aur Millionaire format ki full drama!" />
      <ZoneGrid games={QUIZ_TOPIC_DATA} basePath="/quiz" />
      <TiltCard className="mx-auto mt-10 max-w-2xl overflow-hidden p-8 text-center" intensity={7}>
        <div className="text-5xl">💰</div>
        <h2 className="mt-3 font-display text-2xl font-black text-gradient">Kon Banega Crorepati</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          15 sawalat ki ladder, 7 checkpoints, 3 lifelines (50-50, Audience Poll, Skip) — dramatic hot seat ka poora maza.
        </p>
        <Link href="/quiz/millionaire" className="btn btn-pink mt-5">
          🔥 Hot Seat par baitho
        </Link>
      </TiltCard>
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_QUIZ || undefined} className="mx-auto mt-10 max-w-2xl" />
    </div>
  );
}
