import { getSiteUrl } from "@/lib/env";

/** JSON-LD Game schema for game pages. */
export function GAME_JSON_LD({ name, description, slug, emoji }: { name: string; description: string; slug: string; emoji: string }) {
  const SITE = getSiteUrl();
  const json = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: `${name} — Learn & Play PK`,
    description: `${emoji} ${description} — Learn & Play PK par 100% free.`,
    url: `${SITE}/${slug}`,
    genre: ["Educational", "Arcade", "Puzzle"],
    gamePlatform: ["Web Browser", "Mobile Web"],
    applicationCategory: "Game",
    operatingSystem: "Any",
    inLanguage: ["en", "ur"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "PKR" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
