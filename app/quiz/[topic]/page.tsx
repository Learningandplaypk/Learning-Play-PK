import type { Metadata } from "next";
import { GameLoader } from "@/components/game-loader";
import { QUIZ_TOPIC_DATA, getGameData } from "@/lib/games-data";
import { GAME_JSON_LD } from "@/components/game-jsonld";

export function generateStaticParams() {
  return QUIZ_TOPIC_DATA.map((g) => ({ topic: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const data = getGameData(topic);
  if (!data) return { title: "Quiz" };
  return {
    title: `${data.title} — Free Quiz`,
    description: `${data.desc} ${data.howTo[0]}. Abhi khelo — bina login, bilkul free.`,
    alternates: { canonical: `/quiz/${topic}` },
  };
}

export default async function QuizTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const data = getGameData(topic);
  return (
    <>
      {data && <GAME_JSON_LD name={data.title} description={data.desc} slug={`quiz/${data.slug}`} emoji={data.emoji} />}
      <GameLoader zone="quiz" slug={topic} />
    </>
  );
}
