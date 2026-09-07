"use client";

import React, { useState } from "react";
import { Check, Minus, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button, Card, Chip, Tabs } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { sfx } from "@/lib/sfx";

type Plan = "monthly" | "yearly";

const FEATURES: Array<{ title: string; desc: string }> = [
  { title: "Unlimited games + lessons", desc: "Roz 5 games / 3 lessons ki limit khatam — jitna chaho khelo" },
  { title: "Zero ads", desc: "Game ke beech kabhi ad nahi — pure focus" },
  { title: "Progress reports", desc: "Weekly digest email + detailed graphs" },
  { title: "Certificate", desc: "Level 10+ par downloadable PDF certificate" },
  { title: "Saari 8 languages", desc: "Full content — Arabic Quranic set samet" },
  { title: "Exclusive avatar frames", desc: "Golden frame + premium badge" },
];

const COMPARE: Array<[string, string, string]> = [
  ["43 games", "✓", "✓"],
  ["Daily lessons", "3", "Unlimited"],
  ["Daily games", "5", "Unlimited"],
  ["Ads", "Haan", "Zero"],
  ["Weekly progress email", "—", "✓"],
  ["PDF certificate", "—", "✓"],
  ["Support", "48 hours", "Priority — 12 hours"],
  ["Price", "Rs. 0", "Rs. 399/mahina"],
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
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <div className="mb-8">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-accent-tint text-accent-ink">
          <Sparkles size={26} strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Premium</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Free hamesha free rahega. Premium un logon ke liye hai jo roz aur zyada seekhna chahte hain.
        </p>
      </div>

      {premium && (
        <Card className="mb-6 flex items-center gap-3 border-brand bg-brand-tint p-4">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-brand-tint text-brand-ink">
            <Sparkles size={20} strokeWidth={2.3} />
          </span>
          <div>
            <p className="font-display text-sm font-extrabold text-fg">Tum pehle se Premium ho</p>
            <p className="text-xs text-muted">
              Subscription manage karne ke liye support@learnplaypk.com par rabta karo.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* ------------------------------ plan ------------------------------ */}
        <Card className="border-brand p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Chip tone="brand">Sab se zyada chuna gaya</Chip>
            <Tabs<Plan>
              tabs={[
                { id: "monthly", label: "Mahana" },
                { id: "yearly", label: "Saalana −20%" },
              ]}
              value={plan}
              onChange={setPlan}
            />
          </div>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-display text-5xl font-black text-fg tnum">Rs. {price.toLocaleString("en-PK")}</span>
            <span className="text-sm text-muted">{plan === "monthly" ? "/mahina" : "/saal"}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {plan === "monthly" ? "Kabhi bhi cancel karo." : "2 mahine free — saal bhar ka plan."}
          </p>

          <ul className="mt-6 grid gap-2.5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-fg">{f.title}</span>
                  <span className="block text-xs text-muted">{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 grid gap-2">
            <Button size="lg" disabled={busy !== null || premium} onClick={() => checkout("safepay")}>
              {busy === "safepay" ? "Safepay khul raha…" : "JazzCash / EasyPaisa / Card se karein"}
            </Button>
            <Button size="lg" variant="secondary" disabled={busy !== null || premium} onClick={() => checkout("stripe")}>
              {busy === "stripe" ? "Stripe khul raha…" : "International card — Stripe"}
            </Button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-danger/30 bg-danger-tint p-3 text-xs text-danger-ink">
              {error}
            </p>
          )}

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            Secure checkout — hum card details store nahi karte. Refund policy: 7 din, no questions asked (agar 3 games
            se kam khele hon).
          </p>
        </Card>

        {/* --------------------------- comparison --------------------------- */}
        <Card className="overflow-x-auto p-5 sm:p-6">
          <h2 className="mb-4 font-display text-base font-extrabold text-fg">Free vs Premium</h2>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Comparison of the free plan and Premium</caption>
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="py-2 font-bold">
                  Feature
                </th>
                <th scope="col" className="py-2 text-center font-bold">
                  Free
                </th>
                <th scope="col" className="py-2 text-center font-bold text-brand-ink">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([f, a, b]) => (
                <tr key={f} className="border-t border-line">
                  <th scope="row" className="py-2.5 pr-2 text-left font-semibold text-fg">
                    {f}
                  </th>
                  <td className="py-2.5 text-center text-muted">
                    {a === "—" ? <Minus size={14} strokeWidth={2.4} className="mx-auto" aria-label="Not included" /> : a}
                  </td>
                  <td className="py-2.5 text-center font-bold text-fg">
                    {b === "Zero" ? (
                      <span className="inline-flex items-center gap-1 text-danger-ink">
                        <X size={14} strokeWidth={2.6} /> Zero
                      </span>
                    ) : (
                      b
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Koi countdown nahi, koi pressure nahi. Free plan hamesha rahega — jab chaho upgrade karo.
          </p>
        </Card>
      </div>
    </div>
  );
}
