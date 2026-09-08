import type { Metadata } from "next";
import { MistakesClient } from "@/components/progress/mistakes-client";

export const metadata: Metadata = {
  title: "Mistakes review",
  description: "Aapke ghalat jawabon se bana personal practice set — ek tap mein dobara practice.",
  alternates: { canonical: "/mistakes" },
};

export default function MistakesPage() {
  return <MistakesClient />;
}
