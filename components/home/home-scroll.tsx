"use client";

import { useEffect } from "react";
import { useRichUI } from "@/lib/perf";

/** GSAP ScrollTrigger choreography — loaded only on the home page, only when richUI. */
export default function HomeScroll() {
  const rich = useRichUI();

  useEffect(() => {
    if (!rich) return;
    let reverted = false;
    let ctx: { revert: () => void } | null = null;

    void (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (reverted) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const steps = document.querySelectorAll<HTMLElement>("#how-it-works [data-step]");
        if (steps.length) {
          ScrollTrigger.create({
            trigger: "#how-it-works",
            start: "top 55%",
            end: "bottom 40%",
            onUpdate: (self) => {
              const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length + 0.001));
              steps.forEach((el, idx) => {
                el.dataset.active = idx === i ? "true" : "false";
              });
            },
          });
        }
        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const y = Number(el.dataset.parallax) || -20;
          gsap.to(el, {
            y,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.45 },
          });
        });
        document.querySelectorAll<HTMLElement>("[data-fill]").forEach((el) => {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "0% 50%",
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 80%", once: true },
            }
          );
        });
      });
    })();

    return () => {
      reverted = true;
      ctx?.revert();
    };
  }, [rich]);

  return null;
}
