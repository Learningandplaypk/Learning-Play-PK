import type { Metadata } from "next";
import HomeClient from "@/components/home/home-client";

export const metadata: Metadata = {
  title: "Learn & Play PK — Seekho + Khelo | 3D Language Learning & Games",
  description:
    "Pakistan's first fully 3D gamified learning platform. English, Arabic, Korean aur 7 languages — 40+ games se seekho. XP, streaks, badges, leaderboards. 100% Free.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeClient />;
}
