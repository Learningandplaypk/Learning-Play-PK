import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Learn & Play PK — Seekho + Khelo",
    short_name: "Learn&Play PK",
    description: "Pakistan's first fully 3D gamified language-learning + games platform. 100% Free.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05060F",
    theme_color: "#05060F",
    lang: "en",
    categories: ["education", "games"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
