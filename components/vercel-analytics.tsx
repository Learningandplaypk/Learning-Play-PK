"use client";

import React from "react";
import { Analytics } from "@vercel/analytics/react";

/**
 * Vercel Web Analytics — only mounts on real Vercel deployments.
 * Locally (npm start) the insights script 404s and pollutes the console;
 * this keeps local QA output clean without losing analytics in production.
 */
function isVercelDeployment(hostname: string): boolean {
  return (
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".vercel.run") ||
    hostname === "learnplaypk.com" ||
    hostname.endsWith(".learnplaypk.com")
  );
}

export function VercelAnalytics() {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    setEnabled(isVercelDeployment(window.location.hostname));
  }, []);
  if (!enabled) return null;
  return <Analytics />;
}
