import type { MetadataRoute } from "next";
import { LEARN_GAME_DATA, BRAIN_GAME_DATA, QUIZ_TOPIC_DATA, FUN_GAME_DATA } from "@/lib/games-data";
import { LANG_PATHS } from "@/lib/lang-paths";
import { POSTS } from "@/data/blog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnplaypk.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    "", "/learn", "/brain", "/quiz", "/fun", "/leaderboard", "/profile", "/premium", "/shop",
    "/blog", "/about", "/contact", "/privacy", "/terms", "/refund-policy", "/login", "/signup", "/forgot",
  ];

  // every learn game × every language (matches generateStaticParams)
  const learnGames: string[] = [];
  for (const lang of LANG_PATHS) {
    for (const g of LEARN_GAME_DATA) {
      if (!g.langs || g.langs.includes(lang)) learnGames.push(`/learn/${lang}/${g.slug}`);
    }
  }
  const brainGames = BRAIN_GAME_DATA.map((g) => `/brain/${g.slug}`);
  const quizGames = QUIZ_TOPIC_DATA.map((g) => `/quiz/${g.slug}`);
  const funGames = [...new Set(FUN_GAME_DATA.map((g) => `/fun/${g.slug}`))];
  const langHubs = LANG_PATHS.map((l) => `/learn/${l}`);
  const blogPosts = POSTS.map((p) => `/blog/${p.slug}`);

  const all = [...staticRoutes, ...langHubs, ...learnGames, ...brainGames, ...quizGames, ...funGames, ...blogPosts];
  const prio = (r: string) => (r === "" ? 1 : r.endsWith("/[game]") ? 0.7 : r.split("/").length > 2 ? 0.6 : 0.8);
  return all.map((r) => ({ url: `${SITE}${r}`, lastModified: now, priority: prio(r) }));
}
