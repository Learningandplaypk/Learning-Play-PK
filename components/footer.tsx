"use client";

import React from "react";
import Link from "next/link";
import { Camera, MessageCircle, Users, Video, Volume2, VolumeX } from "lucide-react";
import { usePlayer } from "@/lib/store";
import { LogoMark } from "./brand/ustad";

const COLS = [
  {
    title: "Zones",
    links: [
      { href: "/learn", label: "Learn — Seekho" },
      { href: "/brain", label: "Brain — Dimaag" },
      { href: "/quiz", label: "Quiz" },
      { href: "/fun", label: "Fun — Masti" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/premium", label: "Premium" },
      { href: "/shop", label: "Coin Shop" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
];

export function Footer() {
  const sound = usePlayer((s) => s.sound);
  const setPlayer = usePlayer((s) => s.setPlayer);

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page page-pad grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-base font-extrabold tracking-tight text-fg">
              Learn<span className="text-brand-ink">&amp;</span>Play PK
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Khelo. Seekho. Jeeto. — 43 games, 8 zubanein, Urdu meanings ke sath. Sab free.
          </p>
          <button
            type="button"
            onClick={() => setPlayer({ sound: !sound })}
            aria-pressed={sound}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
          >
            {sound ? <Volume2 size={14} strokeWidth={2.2} /> : <VolumeX size={14} strokeWidth={2.2} />}
            {sound ? "Sound on" : "Sound off"}
          </button>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-fg/85 transition-colors hover:text-brand-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-page page-pad flex flex-col items-start gap-4 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Learn &amp; Play PK — Made in Pakistan 🇵🇰
        </p>
        <div className="flex items-center gap-1">
          {[
            { href: "https://youtube.com", label: "YouTube", Icon: Video },
            { href: "https://instagram.com", label: "Instagram", Icon: Camera },
            { href: "https://twitter.com", label: "X", Icon: MessageCircle },
            { href: "https://facebook.com", label: "Facebook", Icon: Users },
          ].map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="grid h-11 w-11 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Icon size={18} strokeWidth={2} />
            </a>
          ))}
        </div>
      </div>
      {/* room for the mobile tab bar */}
      <div className="h-14 md:hidden" aria-hidden />
    </footer>
  );
}
