import type { Metadata } from "next";
import { FunClient } from "@/components/zones/fun-client";

export const metadata: Metadata = {
  title: "Fun Zone — 15 Arcade Games",
  description: "Snake 3D, Tetris, Flappy, Fruit Ninja, Racing, Bubble Shooter aur mazeed — 15 classic arcade games neon style mein. Sab free, sab mobile-ready.",
  alternates: { canonical: "/fun" },
};

export default function FunPage() {
  return <FunClient />;
}
