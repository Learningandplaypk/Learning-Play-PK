import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Learn & Play PK — Seekho + Khelo",
    short_name: "Learn&Play PK",
    description: "Pakistan's gamified learning + games platform — 43 games, 21 languages, Urdu meanings. 100% Free.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF7",
    theme_color: "#178A55",
    lang: "en",
    categories: ["education", "games"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
