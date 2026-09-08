"use client";

const COLORS = ["#178A55", "#F5A524", "#12734A", "#FAFAF7"];

export async function burstConfetti(originY = 0.65): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 90, spread: 72, origin: { y: originY }, colors: COLORS, disableForReducedMotion: true });
}

/** A few coin dots fly from `from` to the navbar coin counter. */
export function flyCoins(from: DOMRect | null): void {
  if (typeof document === "undefined" || !from) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.getElementById("nav-coins");
  const to = target?.getBoundingClientRect();
  if (!to) return;
  for (let i = 0; i < 6; i++) {
    const el = document.createElement("span");
    el.setAttribute("aria-hidden", "true");
    el.textContent = "●";
    el.style.cssText = [
      "position:fixed",
      `top:${from.top + from.height / 2}px`,
      `left:${from.left + from.width / 2}px`,
      "z-index:400",
      "color:#F5A524",
      "font-size:12px",
      "pointer-events:none",
      "transition:transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms cubic-bezier(0.22,1,0.36,1)",
    ].join(";");
    document.body.appendChild(el);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    requestAnimationFrame(() => {
      el.style.transform = `translate(${dx + (i - 2.5) * 6}px, ${dy}px)`;
      el.style.opacity = "0";
    });
    window.setTimeout(() => el.remove(), 800);
  }
}
