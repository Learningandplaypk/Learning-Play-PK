"use client";

import React from "react";
import Link from "next/link";
import { usePlayer } from "@/lib/store";
import { Button } from "./ui";

export function Footer() {
  const sound = usePlayer((s) => s.sound);
  const setPlayer = usePlayer((s) => s.setPlayer);

  return (
    <footer className="relative z-10 mt-24 border-t border-white/10 bg-bg-800/40 pb-24 pt-14 lg:pb-10">
      <div className="page-pad mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-black">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-neon-green via-electric to-neon-purple">🦉</span>
            <span className="text-gradient">Learn&Play PK</span>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Seekho + Khelo — sab FREE, sab 3D. Pakistan ka pehla fully 3D gamified learning + games platform.
          </p>
          <p className="mt-4 text-sm font-bold text-ink">Made in Pakistan 🇵🇰</p>
        </div>

        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted">Zones</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-ink/80 hover:text-neon-green" href="/learn">📚 Learn Zone</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/brain">🧠 Brain Zone</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/quiz">❓ Quiz Zone</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/fun">🎮 Fun Zone</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/leaderboard">🏆 Leaderboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-ink/80 hover:text-neon-green" href="/about">About</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/blog">Blog</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/premium">Premium — Rs. 399/mo</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/shop">Coin Shop</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-ink/80 hover:text-neon-green" href="/privacy">Privacy Policy</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/terms">Terms of Service</Link></li>
            <li><Link className="text-ink/80 hover:text-neon-green" href="/refund">Refund Policy</Link></li>
          </ul>
          <button
            className="chip mt-5 cursor-pointer hover:text-ink"
            onClick={() => setPlayer({ sound: !sound })}
            aria-pressed={sound}
          >
            {sound ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </button>
          <div className="mt-4 flex gap-3 text-xl" aria-label="Social links">
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition hover:scale-125">▶️</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition hover:scale-125">📸</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition hover:scale-125">🎵</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition hover:scale-125">📘</a>
          </div>
        </div>
      </div>
      <div className="neon-divider mx-auto mt-10 max-w-6xl" />
      <p className="mt-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Learn & Play PK — Sab content original hai. Khelo, seekho, aage barho.
      </p>
    </footer>
  );
}
