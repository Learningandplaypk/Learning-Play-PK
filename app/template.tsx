"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Route transition: 120ms fade + 8px rise. Framer Motion, tree-shaken.
 * prefers-reduced-motion → content appears with no travel.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
