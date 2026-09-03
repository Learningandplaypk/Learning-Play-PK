import type { Metadata } from "next";
import { BrainClient } from "@/components/zones/brain-client";

export const metadata: Metadata = {
  title: "Brain Zone — Dimaagi Games",
  description: "Memory Match, Sudoku, 2048, Chess AI, reaction tests aur mazeed — 10 dimaagi games jo tez dimaag banate hain.",
  alternates: { canonical: "/brain" },
};

export default function BrainPage() {
  return <BrainClient />;
}
