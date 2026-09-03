"use client";

import React, { useState } from "react";
import { Button, TiltCard } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { sfx } from "@/lib/sfx";

type Plan = "monthly" | "yearly";

const FEATURES = [
  ["♾️", "Unlimited games + lessons", "Roz 5 games ki limit khatam — jitna chaho khelo"],
  ["🚫", "Zero ads", "Game ke beech kabhi ad nahi — pure focus"],
  ["📊", "Progress reports", "Weekly digest email + detailed graphs"],
  ["🎓", "Certificate", "Level 10+ par downloadable PDF certificate"],
  ["🌍", "Saari 8 languages", "Full content — Arabic Quranic set samet"],
  ["👑", "Exclusive avatar frames", "Golden frame + premium badge"],
];

export function PremiumClient() {
  const [plan, setPlan] = useState<Plan>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const premium = usePlayer((s) => s.premium);
  const uid = usePlayer((s) => s.uid);

  const price = plan === "monthly" ? 399 : 3990;

  const checkout = async (provider: "stripe" | "safepay") => {
    setBusy(provider);
    setError("");
    sfx("click");
    try {
      const res = await fetch(`/api/checkout/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, uid, planId: plan === "monthly" ? "premium-monthly" : "premium-yearly" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Checkout available nahi — thori dair mein koshish karo.");
    } catch {
      setError("Network issue — dobara koshish karo.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-4xl pb-28 pt-28">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 animate-float place-items-center rounded-3xl bg-gradient-to-br from-neon-orange/40 to-pink-accent/40 text-4xl shadow-[0_0_50px_-10px_rgba(255,122,0,.7)]">👑</div>
        <h1 className="font-display text-3xl font-black sm:text-5xl">
          <span className="text-gradient">Go Premium</span>
        </h1>
        <p className="mt-3 text-muted">Free hamesha free rahega. Premium un liye jo aur tez seekhna chahte hain.</p>
      </div>

      {premium && (
        <div className="glass glow-ring mx-auto mb-8 max-w-md p-5 text-center">
          <div className="text-3xl">👑</div>
          <p className="mt-2 font-display font-black text-neon-orange">Tum pehle se Premium ho!</p>
          <p className="mt-1 text-xs text-muted">Enjoy unlimited — subscription manage karne ke liye support@learnplaypk.com par rabta karo.</p>
        </div>
      )}

      {/* plan toggle */}
      <div className="mx-auto mb-8 flex w-fit gap-1 rounded-full border border-white/10 bg-white/5 p-1">
        <button onClick={() => setPlan("monthly")} className={`rounded-full px-5 py-2 text-sm font-bold transition ${plan === "monthly" ? "bg-white/15" : "text-muted"}`} aria-pressed={plan === "monthly"}>
          Mahana
        </button>
        <button onClick={() => setPlan("yearly")} className={`rounded-full px-5 py-2 text-sm font-bold transition ${plan === "yearly" ? "bg-white/15" : "text-muted"}`} aria-pressed={plan === "yearly"}>
          Saalana <span className="text-neon-green">−20%</span>
        </button>
      </div>

      <TiltCard className="mx-auto max-w-xl p-8" intensity={5}>
        <div className="text-center">
          <div className="font-display text-5xl font-black">
            <span className="text-gradient">Rs. {price.toLocaleString("en-PK")}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{plan === "monthly" ? "/mahina — cancel kabhi bhi" : "/saal — 2 mahine free"}</p>
        </div>

        <ul className="mx-auto mt-7 grid max-w-md gap-2.5">
          {FEATURES.map(([e, t, d]) => (
            <li key={t} className="flex items-start gap-3 rounded-xl bg-white/5 px-3.5 py-2.5">
              <span className="text-xl">{e}</span>
              <span>
                <span className="block text-sm font-bold">{t}</span>
                <span className="block text-xs text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          <Button className="w-full !bg-none !bg-gradient-to-r !from-pink-accent !to-neon-orange !text-black" disabled={busy !== null || premium} onClick={() => checkout("safepay")}>
            {busy === "safepay" ? "Safepay khul raha…" : "💳 JazzCash / EasyPaisa / Card — Safepay"}
          </Button>
          <Button variant="ghost" className="w-full" disabled={busy !== null || premium} onClick={() => checkout("stripe")}>
            {busy === "stripe" ? "Stripe khul raha…" : "🌐 International Card — Stripe"}
          </Button>
        </div>
        {error && <p className="mt-4 rounded-xl bg-pink-accent/15 p-3 text-xs text-pink-accent">⚠️ {error}</p>}
        <p className="mt-4 text-center text-[10px] leading-relaxed text-muted/70">
          Secure checkout — hum card details store nahi karte. Payment confirm hote hi premium foran activate. Refund policy: 7 din, no questions asked (agar 3 games se kam khele hon).
        </p>
      </TiltCard>

      {/* comparison */}
      <div className="glass mx-auto mt-10 max-w-2xl overflow-x-auto p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-muted">
              <th className="py-2">Feature</th>
              <th className="py-2 text-center">Free</th>
              <th className="py-2 text-center text-neon-orange">Premium</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["43 games", "✅", "✅"],
              ["Daily lessons", "3", "♾️"],
              ["Daily games", "5", "♾️"],
              ["Ads", "Haan", "❌ Zero"],
              ["Weekly progress email", "—", "✅"],
              ["PDF certificate", "—", "✅"],
              ["Support", "48h", "Priority 12h"],
            ].map(([f, a, b]) => (
              <tr key={f} className="border-t border-white/5">
                <td className="py-2.5 font-semibold">{f}</td>
                <td className="py-2.5 text-center text-muted">{a}</td>
                <td className="py-2.5 text-center font-bold text-neon-orange">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
