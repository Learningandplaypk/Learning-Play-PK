import type { Metadata } from "next";
import { GameLoader } from "@/components/game-loader";
import { BRAIN_GAME_DATA, getGameData } from "@/lib/games-data";
import { GAME_JSON_LD } from "@/components/game-jsonld";

export function generateStaticParams() {
  return BRAIN_GAME_DATA.map((g) => ({ game: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const data = getGameData(game);
  if (!data) return { title: "Game" };
  return {
    title: `${data.title} — Free Game`,
    description: `${data.desc} ${data.howTo[0]}. Abhi khelo — bina login, bilkul free.`,
    alternates: { canonical: `/brain/${game}` },
  };
}

export default async function BrainGamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const data = getGameData(game);
  return (
    <>
      {data && <GAME_JSON_LD name={data.title} description={data.desc} slug={`brain/${data.slug}`} emoji={data.emoji} />}
      <GameLoader zone="brain" slug={game} />
    </>
  );
}
