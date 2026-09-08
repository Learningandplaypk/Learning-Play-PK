"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, GraduationCap, Home, Moon, Sun, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LogoMark } from "./brand/ustad";
import { AccountWidget, MobileAccountChip, NavCoinAnchor } from "./account-widget";
import { NavPremiumChip } from "./premium/premium-nudge";

const LINKS = [
  { href: "/learn", key: "nav.learn" },
  { href: "/brain", key: "nav.brain" },
  { href: "/quiz", key: "nav.quiz" },
  { href: "/fun", key: "nav.fun" },
  { href: "/leaderboard", key: "nav.leaderboard" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

/* ------------------------------ desktop bar ------------------------------ */

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
      <div className="container-page page-pad flex h-14 items-center gap-3">
        <Link href="/" className="-mx-1 flex min-h-11 min-w-11 shrink-0 items-center gap-2 px-1" aria-label="Learn & Play PK home">
          <LogoMark className="h-8 w-8" />
          <span className="hidden font-display text-base font-extrabold tracking-tight text-fg sm:block">
            Learn<span className="text-brand-ink">&amp;</span>Play PK
          </span>
        </Link>

        <nav aria-label="Main navigation" className="ms-2 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors",
                  active ? "text-brand-ink" : "text-muted hover:bg-surface-2 hover:text-fg"
                )}
              >
                {t(l.key)}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[7px] h-[3px] rounded-full bg-brand" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <NavPremiumChip />
          <NavCoinAnchor />
          <MobileAccountChip />
          <AccountWidget />

          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {theme === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ mobile tabs ------------------------------ */

export function MobileTabs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = [
    { href: "/", label: t("nav.home"), Icon: Home },
    { href: "/learn", label: t("nav.learn"), Icon: GraduationCap },
    { href: "/fun", label: t("nav.fun"), Icon: Gamepad2 },
    { href: "/leaderboard", label: t("nav.leaderboard"), Icon: Trophy },
    { href: "/profile", label: t("nav.profile"), Icon: User },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-line bg-surface/95 backdrop-blur-md md:hidden supports-[backdrop-filter]:bg-surface/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid h-14 grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors",
                active ? "text-brand-ink" : "text-muted"
              )}
            >
              <Icon
                key={active ? `on:${pathname}` : href}
                size={22}
                strokeWidth={active ? 2.5 : 2}
                aria-hidden
                className={active ? "tab-bounce" : undefined}
              />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
