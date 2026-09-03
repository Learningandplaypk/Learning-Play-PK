import type { Metadata } from "next";
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";

export const metadata: Metadata = {
  title: "Leaderboard — Global Rankings",
  description: "Pakistan bhar ke players ka muqabla — global, weekly aur per-game rankings. XP kamao aur top par aao.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
