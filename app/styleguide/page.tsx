import type { Metadata } from "next";
import { StyleGuide } from "@/components/style-guide";

export const metadata: Metadata = {
  title: "Style Guide — Playful Pro design system",
  description: "Internal design system reference: colours, type, buttons, cards, inputs, chips, modals, empty states.",
};

export default function Page() {
  return <StyleGuide />;
}
