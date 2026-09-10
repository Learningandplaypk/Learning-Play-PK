import type { Metadata } from "next";
import { LearnHubClient } from "@/components/zones/learn-hub-client";

export const metadata: Metadata = {
  title: "Learn Zone — 21 Languages, 100% Free",
  description:
    "English, Urdu, Arabic, German, French, Spanish, Turkish, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Bengali, Malay, Persian, Punjabi, Pashto, Sindhi aur Balochi — Urdu meanings, native script aur pronunciation ke sath, games khel kar seekho.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  return <LearnHubClient />;
}
