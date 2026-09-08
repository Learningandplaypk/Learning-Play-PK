import type { Metadata } from "next";
import { ProgressClient } from "@/components/progress/progress-client";

export const metadata: Metadata = {
  title: "Progress report",
  description: "Topic-wise accuracy, weak words, waqt aur weekly chart — apni seekhne ki raftaar dekho.",
  alternates: { canonical: "/progress" },
};

export default function ProgressPage() {
  return <ProgressClient />;
}
