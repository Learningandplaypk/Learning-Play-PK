"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GameCatalog } from "@/components/zone-grid";
import { QUIZ_TOPIC_DATA } from "@/lib/games-data";
import { Card } from "@/components/ui";
import { ZoneArt } from "@/components/brand/ustad";
import { AdSlot } from "@/components/ads";

export function QuizClient() {
  return (
    <GameCatalog
      games={QUIZ_TOPIC_DATA}
      basePath="/quiz"
      zone="quiz"
      title="Quiz Zone"
      urdu="کوئز زون"
      desc="10 topics — timer, streak bonus aur har jawab ki wazahat. Aur Millionaire format ki full drama!"
    >
      <Card className="mt-6 flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-tint">
            <ZoneArt zone="quiz" className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-display text-lg font-extrabold text-fg">Kon Banega Crorepati</h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              15 sawalat ki ladder, 7 checkpoints, 3 lifelines (50-50, Audience Poll, Skip).
            </p>
          </div>
        </div>
        <Link href="/quiz/millionaire" className="btn btn-primary btn-sm shrink-0">
          Hot seat par baitho <ArrowRight size={16} strokeWidth={2.4} />
        </Link>
      </Card>
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_QUIZ || undefined} className="mx-auto mt-10 max-w-2xl" />
    </GameCatalog>
  );
}
