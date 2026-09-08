import type { Metadata } from "next";
import { DownloadsClient } from "@/components/premium/downloads-client";

export const metadata: Metadata = {
  title: "Offline lesson packs",
  description: "Poori zubaan download karo aur bina internet parho. Storage manage karo.",
  alternates: { canonical: "/downloads" },
};

export default function DownloadsPage() {
  return <DownloadsClient />;
}
