"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/components/ui";

export function InViewCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (ents) => {
        if (ents.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const n = useCountUp(value, 900, on);
  return (
    <span ref={ref} className="tnum">
      {n}
      {suffix}
    </span>
  );
}
