import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameLoader } from "@/components/game-loader";
import { LEARN_GAME_DATA, getGameData } from "@/lib/games-data";
import { LANG_PATHS, getLangMeta } from "@/lib/lang-paths";
import { GAME_JSON_LD } from "@/components/game-jsonld";
import { getSiteUrl } from "@/lib/env";
import MANIFEST from "@/data/langs/_manifest.json";

const COUNTS = MANIFEST as Record<string, { words: number; phrases: number; grammar: number; sentences: number }>;

export function generateStaticParams() {
  const params: Array<{ lang: string; game: string }> = [];
  for (const lang of LANG_PATHS) {
    for (const g of LEARN_GAME_DATA) {
      if (!g.langs || g.langs.includes(lang)) params.push({ lang, game: g.slug });
    }
  }
  return params;
}

/** Unique metadata + OG image for every language × lesson combination. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; game: string }>;
}): Promise<Metadata> {
  const { lang, game } = await params;
  const meta = getLangMeta(lang);
  const data = getGameData(game);
  if (!meta || !data) return { title: "Lesson" };
  const c = COUNTS[lang] ?? { words: 300, phrases: 60, grammar: 120, sentences: 60 };
  const title = `${data.title} — Learn ${meta.name} Free`;
  const description = `${data.desc} ${meta.name} (${meta.native}) lesson — ${c.words} words aur ${c.phrases} phrases ka pool, Urdu + English meanings ke sath. Bilkul free, koi limit nahi.`;
  const site = getSiteUrl();
  const og = `${site}/api/og?title=${encodeURIComponent(data.title)}&sub=${encodeURIComponent(
    `Learn ${meta.name}`
  )}&game=${encodeURIComponent(`${data.emoji} ${meta.name} lesson — Learn & Play PK`)}`;
  return {
    title,
    description,
    alternates: { canonical: `/learn/${lang}/${game}` },
    keywords: [`${meta.name} ${data.title.toLowerCase()}`, `learn ${meta.name}`, `${meta.name} practice`, meta.native],
    openGraph: {
      type: "website",
      title,
      description,
      url: `${site}/learn/${lang}/${game}`,
      images: [{ url: og, width: 1200, height: 630, alt: `${data.title} — ${meta.name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default async function LearnGamePage({ params }: { params: Promise<{ lang: string; game: string }> }) {
  const { lang, game } = await params;
  if (!LANG_PATHS.includes(lang)) notFound();
  const data = getGameData(game);
  if (!data || (data.langs && !data.langs.includes(lang))) notFound();
  const meta = getLangMeta(lang);
  return (
    <>
      {data && meta && (
        <GAME_JSON_LD
          name={`${data.title} (${meta.name})`}
          description={`${data.desc} ${meta.name} (${meta.native}) seekhne ka free game.`}
          slug={`learn/${lang}/${data.slug}`}
          emoji={data.emoji}
        />
      )}
      <GameLoader zone="learn" slug={game} lang={lang} />
    </>
  );
}
