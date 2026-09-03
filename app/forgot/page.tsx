import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Password Reset",
  description: "Password bhool gaye? Reset link email par hasil karo.",
  alternates: { canonical: "/forgot" },
};

export default function ForgotPage() {
  return <AuthForm mode="forgot" />;
}
