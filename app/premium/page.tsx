import type { Metadata } from "next";
import { PremiumClient } from "@/components/premium/premium-client";
import { PRICE_PKR } from "@/lib/plans";

export const metadata: Metadata = {
  title: `Premium — Rs. ${PRICE_PKR.monthly}/mahina`,
  description: `Sab kuch free hai — saare games, saare levels, saari zubanein. Premium (Rs. ${PRICE_PKR.monthly}/mahina ya Rs. ${PRICE_PKR.yearly}/saal) zero ads, unlimited hearts, progress reports, certificate aur offline packs deta hai. JazzCash, EasyPaisa aur cards.`,
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return <PremiumClient />;
}
