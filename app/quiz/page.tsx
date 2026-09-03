import type { Metadata } from "next";
import { QuizClient } from "@/components/zones/quiz-client";

export const metadata: Metadata = {
  title: "Quiz Zone — 10 Topics + Crorepati",
  description: "General Knowledge, Pakistan, Islam, Science, Cricket aur Kon Banega Crorepati format — timer, streak bonus aur explanations ke sath.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return <QuizClient />;
}
