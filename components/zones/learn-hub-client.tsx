"use client";

import React from "react";
import Link from "next/link";
import { TiltCard, SectionHeading } from "@/components/ui";
import { ZoneHeader } from "@/components/zone-grid";
import { AdSlot } from "@/components/ads";

const LANGS = [
  { slug: "english", flag: "🇬🇧", name: "English", native: "English", detail: "300+ words • Grammar • Idioms • Stories", color: "#2d7cff" },
  { slug: "arabic", flag: "🇸🇦", name: "Arabic", native: "العربية", detail: "Quranic vocabulary samet", color: "#39ff14" },
  { slug: "turkish", flag: "🇹🇷", name: "Turkish", native: "Türkçe", detail: "Ertugrul wali zuban!", color: "#ff2e97" },
  { slug: "chinese", flag: "🇨🇳", name: "Chinese", native: "中文", detail: "Mandarin basics", color: "#ff7a00" },
  { slug: "french", flag: "🇫🇷", name: "French", native: "Français", detail: "Romance languages ki queen", color: "#2d7cff" },
  { slug: "spanish", flag: "🇪🇸", name: "Spanish", native: "Español", detail: "Duniya ki 2nd bari zuban", color: "#ff7a00" },
  { slug: "korean", flag: "🇰🇷", name: "Korean", native: "한국어", detail: "K-drama aur K-pop ke liye", color: "#b026ff" },
  { slug: "japanese", flag: "🇯🇵", name: "Japanese", native: "日本語", detail: "Anime ke fans ke liye", color: "#ff2e97" },
];

export function LearnHubClient() {
  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-6xl pb-28 pt-28">
      <ZoneHeader emoji="📚" title="Learn Zone" urdu="سیکھنے کا زون" desc="8 languages — har language mein words, phrases, listening aur pronunciation games. Urdu + English meanings ke sath." />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {LANGS.map((l) => (
          <TiltCard key={l.slug} className="group flex flex-col p-5">
            <Link href={`/learn/${l.slug}`} className="flex h-full flex-col" aria-label={`${l.name} seekho`}>
              <div className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-125">{l.flag}</div>
              <h3 className="font-display text-lg font-bold">{l.name}</h3>
              <p className="text-sm text-muted">{l.native}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted/80">{l.detail}</p>
              <span className="mt-auto pt-3 text-xs font-bold" style={{ color: l.color }}>
                Seekhna shuru karo →
              </span>
            </Link>
          </TiltCard>
        ))}
      </div>

      <div className="mt-16">
        <SectionHeading kicker="Kaise kaam karta hai" title="Khel kar seekho — seriously." sub="Har lesson game 3-5 minute ka hota hai. XP kamao, streak rakho, words yaad rakho." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { e: "1️⃣", t: "Language chuno", d: "English full course hai; 7 aur languages starter packs ke sath." },
            { e: "2️⃣", t: "Games khelo", d: "Word Builder, Vocab Battle, Listening, Pronunciation — har game XP deta hai." },
            { e: "3️⃣", t: "Streak rakho", d: "Roz thora thora — 30 din mein results dekho. Daily rewards bhi milte hain." },
          ].map((s) => (
            <TiltCard key={s.t} className="p-6">
              <div className="text-3xl">{s.e}</div>
              <h4 className="mt-3 font-display text-lg font-bold">{s.t}</h4>
              <p className="mt-2 text-sm text-muted">{s.d}</p>
            </TiltCard>
          ))}
        </div>
      </div>
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEARN} className="mx-auto mt-12 max-w-2xl" />
    </div>
  );
}
