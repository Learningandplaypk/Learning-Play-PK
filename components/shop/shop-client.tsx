"use client";

import React, { useState } from "react";
import { Button, Card } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { fmt } from "@/lib/utils";
import { sfx } from "@/lib/sfx";
import { Coins, Lightbulb, Heart, Snowflake } from "lucide-react";

const COIN_PACKS = [
  { coins: 500, price: 50, tag: "Starter", emoji: "🪙" },
  { coins: 1200, price: 100, tag: "Popular", emoji: "💰" },
  { coins: 3000, price: 250, tag: "Value", emoji: "🏦" },
  { coins: 7000, price: 500, tag: "Best deal", emoji: "👑" },
];

const POWERUPS = [
  { id: "hint" as const, Icon: Lightbulb, name: "Hint", desc: "Mushkil sawal mein madad", price: 20 },
  { id: "heart" as const, Icon: Heart, name: "Extra Life", desc: "Game mein ek zindagi wapis", price: 30 },
  { id: "freeze" as const, Icon: Snowflake, name: "Streak Freeze", desc: "Miss hue din par streak bachao", price: 60 },
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
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <div className="mb-8">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-accent-tint text-accent-ink">
          <Coins size={26} strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Coin Shop</h1>
        <p className="mt-2 text-base text-muted">
          Tumhare paas: <b className="text-accent-ink tnum">{fmt(s.coins)}</b> coins
        </p>
      </div>

      <h2 className="mb-4 font-display text-xl font-extrabold text-fg">Power-ups (coins se)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {POWERUPS.map((p) => (
          <Card key={p.id} className="p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-tint text-brand-ink">
              <p.Icon size={20} strokeWidth={2.3} />
            </span>
            <h3 className="mt-3 font-display text-base font-extrabold text-fg">{p.name}</h3>
            <p className="mt-1 text-xs text-muted">{p.desc}</p>
            <p className="mt-2 text-xs text-muted">
              Owned: <b className="text-fg tnum">{p.id === "hint" ? s.hints : p.id === "heart" ? "next game" : s.freezes}</b>
            </p>
            <Button
              size="sm"className="mt-3 w-full"disabled={s.coins < p.price}
              onClick={() => {
                const ok = s.buyItem(p.id);
                if (ok) {
                  sfx("coin");
                  s.toast("🪙", `${p.name} khareed liya!`, `-${p.price} coins`);
                }
              }}
            >
              {p.price} coins — Khareedo
            </Button>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 mt-12 font-display text-xl font-extrabold text-fg">Coin packs</h2>
      <p className="mb-4 text-xs text-muted">Server-side verified payment — Safepay ke zariye JazzCash / EasyPaisa / cards.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COIN_PACKS.map((p) => (
          <Card key={p.coins} className="relative p-5">
            {p.tag === "Best deal" && <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black text-[#1C1C1A]">BEST</span>}
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-tint text-2xl text-accent-ink">
              {p.emoji}
            </span>
            <div className="mt-3 font-display text-2xl font-black text-fg tnum">{fmt(p.coins)}</div>
            <div className="text-xs text-muted">coins</div>
            <Button size="sm" variant="secondary" className="mt-3 w-full" disabled={busy === p.coins} onClick={() => buyCoins(p.coins, p.price)}>
              {busy === p.coins ? "…" : `Rs. ${p.price}`}
            </Button>
          </Card>
        ))}
      </div>
      {error && (
        <p className="mx-auto mt-6 max-w-md rounded-xl border border-danger/30 bg-danger-tint p-3 text-center text-xs text-danger-ink">
          {error}
        </p>
      )}
      <p className="mt-8 text-center text-[10px] text-muted/70">Coins sirf in-app power-ups ke liye hain — cash value nahi. Payments secure hain (webhook-verified).</p>
    </div>
  );
}
