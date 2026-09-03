"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

/* ---------------- Button ---------------- */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "neon" | "ghost" | "pink";
  size?: "md" | "sm";
  magnetic?: boolean;
};

export function Button({ variant = "neon", size = "md", className, onClick, onMouseEnter, magnetic, ...rest }: BtnProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate(${dx * 0.15}px, ${dy * 0.18}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <button
      ref={ref}
      data-magnetic
      className={cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)}
      onClick={(e) => {
        sfx("click");
        onClick?.(e);
      }}
      onMouseEnter={(e) => {
        sfx("hover");
        onMouseEnter?.(e);
      }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      {...rest}
    />
  );
}

/* ---------------- Glass card with 3D tilt ---------------- */

export function TiltCard({
  children,
  className,
  intensity = 10,
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * intensity}deg) rotateX(${-py * intensity}deg) translateY(-3px)`;
    if (glow) el.style.boxShadow = `${-px * 30}px ${-py * 30}px 50px -20px rgba(176,38,255,.5), 0 0 40px -18px rgba(45,124,255,.6)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.boxShadow = "";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("glass glass-hover will-change-transform", className)}>
      {children}
    </div>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("glass pop-in relative z-10 max-h-[88vh] w-full overflow-y-auto p-6", wide ? "max-w-2xl" : "max-w-md")}>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Inputs ---------------- */

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-ink placeholder:text-muted/70 outline-none transition focus:border-electric/70 focus:bg-white/[0.07] focus:shadow-[0_0_24px_-8px_rgba(45,124,255,.6)]",
        className
      )}
      {...rest}
    />
  );
});

export { Input };

/* ---------------- Progress ---------------- */

export function Progress({ value, className, accent }: { value: number; className?: string; accent?: string }) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: accent ?? "linear-gradient(90deg,#39ff14,#2d7cff,#b026ff)",
          boxShadow: "0 0 12px rgba(57,255,20,.5)",
        }}
      />
    </div>
  );
}

/* ---------------- Section heading ---------------- */

export function SectionHeading({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      {kicker && <div className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-neon-green">{kicker}</div>}
      <h2 className="font-display text-3xl font-extrabold sm:text-4xl lg:text-5xl">
        <span className="text-gradient">{title}</span>
      </h2>
      {sub && <p className="mx-auto mt-4 max-w-2xl text-[15px] text-muted">{sub}</p>}
    </div>
  );
}

/* ---------------- Stat pill ---------------- */

export function StatPill({ emoji, value, label }: { emoji: string; value: React.ReactNode; label: string }) {
  return (
    <div className="glass flex items-center gap-3 px-4 py-2.5">
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <div className="leading-tight">
        <div className="font-display text-sm font-bold text-ink">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      </div>
    </div>
  );
}
