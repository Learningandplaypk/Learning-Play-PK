import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign Up — Free Account",
  description: "Free account banao — progress cloud mein save, leaderboard par naam, aur streak reminders.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
