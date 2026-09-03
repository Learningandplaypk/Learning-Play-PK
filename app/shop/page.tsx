import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/shop-client";

export const metadata: Metadata = {
  title: "Coin Shop — Power-ups & Packs",
  description: "Coins se hints, extra lives aur streak freeze khareedo — ya coin packs khareedo. Server-verified, secure.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <ShopClient />;
}
