import type { Metadata } from "next";
import { LearnHubClient } from "@/components/zones/learn-hub-client";

export const metadata: Metadata = {
  title: "Learn Zone — 8 Languages",
  description: "English, Arabic, Turkish, Chinese, French, Spanish, Korean aur Japanese — Urdu meanings, native script aur pronunciation ke sath seekho.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  return <LearnHubClient />;
}
