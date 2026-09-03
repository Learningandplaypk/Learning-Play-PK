import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameLoader } from "@/components/game-loader";
import { LEARN_GAME_DATA, getGameData } from "@/lib/games-data";
import { LANG_PATHS, langLabel } from "@/lib/lang-paths";
import { GAME_JSON_LD } from "@/components/game-jsonld";

export function generateStaticParams() {
  const params: Array<{ lang: string; game: string }> = [];
  for (const lang of LANG_PATHS) {
    for (const g of LEARN_GAME_DATA) {
      if (!g.langs || g.langs.includes(lang)) params.push({ lang, game: g.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; game: string }> }): Promise<Metadata> {
  const { lang, game } = await params;
  const label = langLabel(lang) ?? lang;
  const data = getGameData(game);
  if (!data) return { title: "Lesson" };
  return {
    title: `${data.title} — ${label} Lesson`,
    description: `${data.desc} ${label} seekhne ka free game — Urdu meanings ke sath.`,
    alternates: { canonical: `/learn/${lang}/${game}` },
  };
}

export default async function LearnGamePage({ params }: { params: Promise<{ lang: string; game: string }> }) {
  const { lang, game } = await params;
  if (!LANG_PATHS.includes(lang)) notFound();
  const data = getGameData(game);
  return (
    <>
      {data && <GAME_JSON_LD name={`${data.title} (${langLabel(lang)})`} description={data.desc} slug={`learn/${lang}/${data.slug}`} emoji={data.emoji} />}
      <GameLoader zone="learn" slug={game} lang={lang} />
    </>
  );
}
