"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui";
import { ZoneArt } from "@/components/brand/ustad";
import { LANG_PATHS, langFlag, langLabel } from "@/lib/lang-paths";
import { AdSlot } from "@/components/ads";

const DETAIL: Record<string, { detail: string; rtl?: boolean }> = {
  english: { detail: "300+ words • Grammar • Idioms • Stories" },
  arabic: { detail: "Quranic vocabulary samet", rtl: true },
  turkish: { detail: "Ertugrul wali zuban!", rtl: true },
  chinese: { detail: "Mandarin basics" },
  french: { detail: "Romance languages ki queen" },
  spanish: { detail: "Duniya ki 2nd bari zuban" },
  korean: { detail: "K-drama aur K-pop ke liye" },
  japanese: { detail: "Anime ke fans ke liye" },
};

const NATIVE: Record<string, string> = {
  english: "English",
  arabic: "العربية",
  turkish: "Türkçe",
  chinese: "中文",
  french: "Français",
  spanish: "Español",
  korean: "한국어",
  japanese: "日本語",
};

export function LearnHubClient() {
  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <div className="mb-8">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint">
          <ZoneArt zone="learn" className="h-8 w-8" />
        </span>
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Learn Zone</h1>
        <p className="urdu mt-1 text-base text-brand-ink">سیکھنے کا زون</p>
        <p className="mt-2 max-w-2xl text-base text-muted">
          8 zubanein — har language mein words, phrases, listening aur pronunciation games. Urdu + English meanings ke
          sath.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {LANG_PATHS.map((slug) => {
          const cfg = DETAIL[slug] ?? { detail: "" };
          return (
            <Link key={slug} href={`/learn/${slug}`} className="group">
              <Card className="flex h-full flex-col p-4 transition-colors group-hover:border-brand">
                <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-tint text-xl">
                  {langFlag(slug)}
                </span>
                <h2 className="font-display text-base font-extrabold text-fg">{langLabel(slug)}</h2>
                <p
                  className="mt-0.5 text-sm text-brand-ink"
                  {...(cfg.rtl ? { dir: "rtl" } : {})}
                >
                  {NATIVE[slug]}
                </p>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{cfg.detail}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-ink">
                  Seekhna shuru karo <ArrowRight size={13} strokeWidth={2.6} />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-14">
        <SectionHeading
          title="Khel kar seekho — seriously"
          sub="Har lesson 3-5 minute ka hai. XP kamao, streak rakho, words yaad rakho."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { n: "1", t: "Language chuno", d: "English full course hai; 7 aur languages starter packs ke sath." },
            { n: "2", t: "Games khelo", d: "Word Builder, Vocab Battle, Listening, Pronunciation — har game XP deta hai." },
            { n: "3", t: "Streak rakho", d: "Roz thora thora — 30 din mein results dekho. Daily rewards bhi milte hain." },
          ].map((s) => (
            <Card key={s.n} className="p-5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand-tint font-display text-base font-extrabold text-brand-ink">
                {s.n}
              </span>
              <h3 className="mt-3 font-display text-base font-extrabold text-fg">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </Card>
          ))}
        </div>
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEARN || undefined} className="mx-auto mt-12 max-w-2xl" />
    </div>
  );
}
