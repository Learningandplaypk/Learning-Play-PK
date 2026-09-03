import type { Metadata } from "next";
import { PremiumClient } from "@/components/premium/premium-client";

export const metadata: Metadata = {
  title: "Premium — Rs. 399/mahina",
  description: "Unlimited games, zero ads, progress reports, certificate download aur 8 languages full content — sirf Rs. 399/mahina. JazzCash, EasyPaisa aur cards accepted.",
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return <PremiumClient />;
}
