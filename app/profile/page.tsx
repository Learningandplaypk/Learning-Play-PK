import type { Metadata } from "next";
import { ProfileClient } from "@/components/profile/profile-client";

export const metadata: Metadata = {
  title: "Profile — Trophy Room",
  description: "Aapka avatar, XP, level, badges ka trophy room, progress graphs aur settings.",
  alternates: { canonical: "/profile" },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
