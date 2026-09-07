import type { Metadata } from "next";
import HomeClient from "@/components/home/home-client";

export const metadata: Metadata = {
  title: "Learn & Play PK — Khelo. Seekho. Jeeto. | Free Learning Games & Quizzes",
  description:"Pakistan ka gamified learning platform — English, Arabic, Korean aur 5 aur zubanein, 43 games se seekho. XP, streaks, badges, leaderboards. 100% Free.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeClient />;
}
