import type { Metadata } from "next";
import { AccountClient } from "@/components/premium/account-client";

export const metadata: Metadata = {
  title: "Account & subscription",
  description: "Subscription manage karo, cosmetics chuno aur support se rabta karo.",
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <AccountClient />;
}
