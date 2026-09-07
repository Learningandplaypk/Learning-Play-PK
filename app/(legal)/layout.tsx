import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return <div className="container-page page-pad max-w-3xl pb-24 pt-8 md:pb-10">{children}</div>;
}
