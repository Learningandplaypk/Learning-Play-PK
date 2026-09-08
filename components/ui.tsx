"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sfx";
import { lockScroll } from "@/lib/scroll-lock";

/* ------------------------------- Button --------------------------------- */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  quiet?: boolean; // no click SFX (e.g. game inputs)
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  quiet,
  className,
  onClick,
  type = "button",
  ...rest
}: BtnProps) {
  return (
    <button
      type={type}
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "btn-danger",
        size === "sm" && "btn-sm",
        size === "lg" && "btn-lg",
        block && "btn-block",
        className
      )}
      onClick={(e) => {
        if (!quiet) sfx("click");
        onClick?.(e);
      }}
      {...rest}
    />
  );
}

/** Link that looks exactly like a chunky button (no client JS needed). */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <a
      href={href}
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "btn-danger",
        size === "sm" && "btn-sm",
        size === "lg" && "btn-lg",
        block && "btn-block",
        className
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

/* ------------------------------- Card ----------------------------------- */

export function Card({ children, className, ...rest }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("card", className)} {...rest}>
      {children}
    </div>
  );
}

/** Plain surface block (no shadow) — grids, rows, tiles. */
export function Surface({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-line bg-surface-2", className)}>{children}</div>;
}

/* ------------------------------- Inputs --------------------------------- */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn("field", className)} {...rest} />;
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn("field", "min-h-28 resize-y", className)} {...rest} />;
  }
);

export function Label({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("label", className)}>
      {children}
    </label>
  );
}

/* ------------------------------- Chip ----------------------------------- */

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "accent" | "danger" | "info";
  className?: string;
}) {
  return <span className={cn("chip", tone !== "neutral" && `chip-${tone}`, className)}>{children}</span>;
}

/** 1–3 filled dots = difficulty. */
export function DifficultyDots({ level, className }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span role="img" className={cn("inline-flex items-center gap-1", className)} aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: i <= level ? "var(--brand)" : "var(--border)" }}
        />
      ))}
    </span>
  );
}

/* ------------------------------ Progress -------------------------------- */

export function Progress({
  value,
  className,
  tone = "brand",
  label = "Progress",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "accent" | "danger";
  label?: string;
}) {
  const color = tone === "accent" ? "var(--accent)" : tone === "danger" ? "var(--danger)" : "var(--brand)";
  return (
    <div
      className={cn("track", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

/* ------------------------------- Skeleton ------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4">
      <Skeleton className="mb-3 h-12 w-12 rounded-xl" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="mb-4 h-3 w-full" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  );
}

/* ---------------------------- Section heading --------------------------- */

export function SectionHeading({
  title,
  sub,
  action,
  className,
  id,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 id={id} className="font-display text-xl font-extrabold text-fg sm:text-2xl">
          {title}
        </h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------- Stat tile ------------------------------ */

export function StatTile({
  icon,
  value,
  label,
  tone = "neutral",
  className,
}: {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone?: "neutral" | "brand" | "accent" | "info";
  className?: string;
}) {
  const tint =
    tone === "brand" ? "var(--brand-tint)" : tone === "accent" ? "var(--accent-tint)" : tone === "info" ? "var(--info-tint)" : "var(--surface-2)";
  const ink =
    tone === "brand" ? "var(--brand-ink)" : tone === "accent" ? "var(--accent-ink)" : tone === "info" ? "var(--info-ink)" : "var(--text)";
  return (
    <div className={cn("card flex items-center gap-3 p-4", className)}>
      {icon && (
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px]"
          style={{ background: tint, color: ink }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="font-display text-xl font-extrabold leading-tight text-fg tnum">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </div>
  );
}

/* ------------------------------ Empty state ----------------------------- */

export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-start gap-4 p-6 text-start sm:p-8", className)}>
      <div className="flex w-full flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-start">
        {icon}
        <div className="min-w-0">
          <h2 className="font-display text-lg font-extrabold text-fg">{title}</h2>
          {body && <p className="mt-1 text-sm text-muted">{body}</p>}
        </div>
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}

/* -------------------------------- Modal --------------------------------- */

function useScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    return lockScroll();
  }, [open]);
}

export function Modal({
  open,
  onClose,
  children,
  wide,
  title,
  labelledBy,
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  wide?: boolean;
  title?: string;
  labelledBy?: string;
}) {
  useScrollLock(open);
  const headingId = useId();

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  if (!open) return null;

  return createPortal(
    <div className="anim-overlay fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onClose} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy ?? (title ? headingId : undefined)}
            className={cn(
              "relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-md sm:rounded-2xl sm:p-6",
              wide ? "sm:max-w-2xl" : "sm:max-w-md"
            )}
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute end-3 top-3 grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
            {title && (
              <h2 id={headingId} className="mb-3 pe-10 font-display text-lg font-extrabold text-fg">
                {title}
              </h2>
            )}
        {children}
      </div>
    </div>,
    document.body
  );
}

/* -------------------------------- Sheet --------------------------------- */
/** Bottom sheet on mobile, centred dialog on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useScrollLock(open);
  const headingId = useId();

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  if (!open) return null;

  return createPortal(
    <div className="anim-overlay fixed inset-0 z-[310] flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onClose} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? headingId : undefined}
            className="anim-sheet relative z-10 max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-md sm:max-w-md sm:rounded-2xl"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--border)] sm:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-4 p-5 pb-3">
              {title && (
                <h2 id={headingId} className="font-display text-lg font-extrabold text-fg">
                  {title}
                </h2>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="px-5">{children}</div>
        {footer && <div className="mt-4 px-5 pt-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------- Icon button ---------------------------- */

export function IconButton({
  label,
  children,
  className,
  ...rest
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} className={cn("icon-btn", className)} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------- Tabs ----------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  const i = Math.max(0, tabs.findIndex((t) => t.id === value));
  return (
    <div
      role="tablist"
      className={cn("relative inline-flex gap-1 rounded-full border border-line bg-surface-2 p-1", className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-surface shadow-sm transition-transform duration-150 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${tabs.length})`,
          transform: `translateX(calc(${i} * 100% + ${i} * 0.25rem))`,
        }}
      />
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative z-[1] min-h-11 rounded-full px-4 text-sm font-semibold transition-colors",
            value === t.id ? "text-fg" : "text-muted hover:text-fg"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------- Number ticker ------------------------------ */

export function useCountUp(target: number, duration = 700, enabled = true) {
  const [val, setVal] = React.useState(enabled ? 0 : target);
  const ref = useRef<number>(0);
  useEffect(() => {
    if (!enabled) {
      setVal(target);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    ref.current = raf;
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return val;
}
