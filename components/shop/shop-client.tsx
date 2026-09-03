"use client";

import React, { useState } from "react";
import { Button, TiltCard } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { fmt } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

const COIN_PACKS = [
  { coins: 500, price: 50, tag: "Starter", emoji: "🪙" },
  { coins: 1200, price: 100, tag: "Popular", emoji: "💰" },
  { coins: 3000, price: 250, tag: "Value", emoji: "🏦" },
  { coins: 7000, price: 500, tag: "Best deal", emoji: "👑" },
];

const POWERUPS = [
  { id: "hint" as const, emoji: "💡", name: "Hint", desc: "Mushkil sawal mein madad", price: 20 },
  { id: "heart" as const, emoji: "❤️", name: "Extra Life", desc: "Game mein ek zindagi wapis", price: 30 },
  { id: "freeze" as const, emoji: "❄️", name: "Streak Freeze", desc: "Miss hue din par streak bachao", price: 60 },
];

export function ShopClient() {
  const s = usePlayer();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const buyCoins = async (coins: number, price: number) => {
    setBusy(coins);
    setError("");
    sfx("click");
    try {
      const res = await fetch("/api/checkout/safepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: `coins-${coins}`, coins, uid: s.uid, amount: price }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Checkout available nahi.");
    } catch {
      setError("Network issue — dobara koshish karo.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-4xl pb-28 pt-28">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 animate-float place-items-center rounded-3xl bg-gradient-to-br from-neon-orange/40 to-pink-accent/40 text-4xl">🪙</div>
        <h1 className="font-display text-3xl font-black sm:text-5xl">
          <span className="text-gradient">Coin Shop</span>
        </h1>
        <p className="mt-3 text-sm text-muted">Tumhare paas: <b className="text-neon-orange">{fmt(s.coins)} coins</b></p>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">⚡ Power-ups (coins se)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {POWERUPS.map((p) => (
          <TiltCard key={p.id} className="p-5 text-center">
            <div className="text-4xl">{p.emoji}</div>
            <h3 className="mt-2 font-display font-bold">{p.name}</h3>
            <p className="mt-1 text-xs text-muted">{p.desc}</p>
            <p className="mt-2 text-xs text-muted">
              Owned: <b className="text-ink">{p.id === "hint" ? s.hints : p.id === "heart" ? "next game" : s.freezes}</b>
            </p>
            <Button
              size="sm"
              className="mt-3 w-full"
              disabled={s.coins < p.price}
              onClick={() => {
                const ok = s.buyItem(p.id);
                if (ok) {
                  sfx("coin");
                  s.toast(p.emoji, `${p.name} khareed liya!`, `-${p.price} coins`);
                }
              }}
            >
              🪙 {p.price} — Khareedo
            </Button>
          </TiltCard>
        ))}
      </div>

      <h2 className="mb-4 mt-12 font-display text-xl font-bold">💰 Coin Packs</h2>
      <p className="mb-4 text-xs text-muted">Server-side verified payment — Safepay ke zariye JazzCash / EasyPaisa / cards.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COIN_PACKS.map((p) => (
          <TiltCard key={p.coins} className="relative p-5 text-center">
            {p.tag === "Best deal" && <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-neon-green to-electric px-2.5 py-0.5 text-[10px] font-black text-black">BEST</span>}
            <div className="text-4xl">{p.emoji}</div>
            <div className="mt-2 font-display text-2xl font-black">{fmt(p.coins)}</div>
            <div className="text-xs text-muted">coins</div>
            <Button size="sm" variant="pink" className="mt-3 w-full" disabled={busy === p.coins} onClick={() => buyCoins(p.coins, p.price)}>
              {busy === p.coins ? "…" : `Rs. ${p.price}`}
            </Button>
          </TiltCard>
        ))}
      </div>
      {error && <p className="mx-auto mt-6 max-w-md rounded-xl bg-pink-accent/15 p-3 text-center text-xs text-pink-accent">⚠️ {error}</p>}
      <p className="mt-8 text-center text-[10px] text-muted/70">Coins sirf in-app power-ups ke liye hain — cash value nahi. Payments secure hain (webhook-verified).</p>
    </div>
  );
}
