"use client";

/**
 * Route transition: a single 160ms fade + 6px rise.
 * CSS-only (no motion library) so it costs 0 KB of JS.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-page">{children}</div>;
}
