import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return <div className="page-pad mx-auto min-h-[100dvh] max-w-2xl pb-28 pt-32">{children}</div>;
}
