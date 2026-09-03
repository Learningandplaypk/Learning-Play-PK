import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LANG_PATHS, langLabel } from "@/lib/lang-paths";
import { LearnPathClient } from "@/components/zones/learn-path-client";

export function generateStaticParams() {
  return LANG_PATHS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const label = langLabel(lang);
  if (!label) return { title: "Language" };
  return {
    title: `${label} Seekho — Games ke Sath`,
    description: `${label} seekhne ke 8 games — words, phrases, grammar, listening aur pronunciation. Urdu meanings ke sath, bilkul free.`,
    alternates: { canonical: `/learn/${lang}` },
  };
}

export default async function LearnLangPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!LANG_PATHS.includes(lang)) notFound();
  return <LearnPathClient lang={lang} />;
}
