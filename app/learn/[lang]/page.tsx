import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearnPathClient } from "@/components/zones/learn-path-client";
import { LEARN_GAME_DATA } from "@/lib/games-data";
import { LANG_PATHS, getLangMeta } from "@/lib/lang-paths";
import { getSiteUrl } from "@/lib/env";
import MANIFEST from "@/data/langs/_manifest.json";

const COUNTS = MANIFEST as Record<string, { words: number; phrases: number; grammar: number; sentences: number }>;

export function generateStaticParams() {
  return LANG_PATHS.map((lang) => ({ lang }));
}

/** Unique metadata + OG image per language (21 language hubs). */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const meta = getLangMeta(lang);
  if (!meta) return { title: "Language" };
  const games = LEARN_GAME_DATA.filter((g) => !g.langs || g.langs.includes(lang));
  // English is the TS reference pack, so it has no manifest row
  const c = COUNTS[lang] ?? { words: 300, phrases: 60, grammar: 120, sentences: 60 };
  const title = `${meta.name} Seekho — ${games.length} Free Games`;
  const description = `${meta.name} (${meta.native}) seekhne ke ${games.length} free games — ${c.words} words, ${c.phrases} phrases, grammar aur listening. Urdu meanings ke sath, bilkul free.`;
  const site = getSiteUrl();
  const og = `${site}/api/og?title=${encodeURIComponent(`${meta.name} Seekho`)}&sub=${encodeURIComponent(
    `${c.words} words - ${c.phrases} phrases - ${games.length} free games`
  )}&game=${encodeURIComponent(`Learn & Play PK · ${meta.name}`)}`;
  return {
    title,
    description,
    alternates: { canonical: `/learn/${lang}` },
    keywords: [`${meta.name} seekho`, `learn ${meta.name}`, `${meta.name} games`, `${meta.native}`, "Urdu meanings"],
    openGraph: {
      type: "website",
      title,
      description,
      url: `${site}/learn/${lang}`,
      images: [{ url: og, width: 1200, height: 630, alt: `${meta.name} — Learn & Play PK` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

/** Course + ItemList JSON-LD so the language hub is indexable as a course. */
function LanguageJsonLd({ lang }: { lang: string }) {
  const meta = getLangMeta(lang);
  if (!meta) return null;
  const site = getSiteUrl();
  const games = LEARN_GAME_DATA.filter((g) => !g.langs || g.langs.includes(lang));
  const c = COUNTS[lang] ?? { words: 300, phrases: 60, grammar: 120, sentences: 60 };
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "@id": `${site}/learn/${lang}#course`,
        name: `Learn ${meta.name} — free games`,
        description: `${meta.name} (${meta.native}) starter course: ${c.words} words, ${c.phrases} phrases, ${c.grammar} grammar questions and ${games.length} games, with Urdu meanings.`,
        inLanguage: [lang, "en", "ur"],
        provider: { "@type": "Organization", name: "Learn & Play PK", url: site },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT10M",
        },
        offers: { "@type": "Offer", price: "0", priceCurrency: "PKR", availability: "https://schema.org/InStock" },
      },
      {
        "@type": "ItemList",
        name: `${meta.name} lessons`,
        itemListElement: games.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${site}/learn/${lang}/${g.slug}`,
          name: `${g.title} — ${meta.name}`,
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

export default async function LearnLangPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!LANG_PATHS.includes(lang)) notFound();
  return (
    <>
      <LanguageJsonLd lang={lang} />
      <LearnPathClient lang={lang} />
    </>
  );
}
