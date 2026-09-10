import type { Metadata } from "next";
import { LangPickerClient, type LangCounts } from "@/components/zones/lang-picker-client";
import MANIFEST from "@/data/langs/_manifest.json";
import { LANG_REGISTRY } from "@/lib/lang-registry";

export const metadata: Metadata = {
  title: "Add a language — 21 free languages",
  description:
    "German, Italian, Russian, Persian, Hindi, Bengali, Punjabi, Pashto, Sindhi, Balochi aur 11 aur — 300 words, 120 phrases aur 8 games har language mein, bilkul free.",
  alternates: { canonical: "/learn/add" },
};

export default function AddLanguagePage() {
  const manifest = MANIFEST as Record<string, { words: number; phrases: number; grammar: number; sentences: number }>;
  const counts: LangCounts = {};
  for (const meta of LANG_REGISTRY) {
    const row = manifest[meta.slug];
    if (row) counts[meta.slug] = { words: row.words, phrases: row.phrases, grammar: row.grammar, sentences: row.sentences };
  }
  return <LangPickerClient counts={counts} />;
}
