"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Info, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Card, Chip } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import {
  COMPARE_ROWS,
  FAQ,
  PLANS,
  PRICE_PKR,
  TRIAL_DAYS_YEARLY,
  YEARLY_MONTHLY_EQUIV,
  YEARLY_SAVING_PCT,
  FEATURES,
} from "@/lib/plans";
import { COSMETIC_COUNTS } from "@/lib/cosmetics";
import { PREMIUM_FREEZES_PER_MONTH, PREMIUM_REPAIRS_PER_MONTH } from "@/lib/entitlements";

type PlanKey = "premium-monthly" | "premium-yearly";

type PaymentsStatus = {
  anyConfigured: boolean;
  providers: Array<{ id: string; name: string; configured: boolean }>;
};

const PREMIUM_FEATURES: Array<{ title: string; desc: string }> = [
  { title: "Zero ads", desc: "Koi banner nahi, koi rewarded prompt nahi. Ad script load hi nahi hoti." },
  { title: "Unlimited hearts", desc: "Lessons mein hearts khatam hone ka intezar nahi — bas parhte raho." },
  {
    title: `Streak freeze ${PREMIUM_FREEZES_PER_MONTH}/mahina + repair ${PREMIUM_REPAIRS_PER_MONTH}/mahina`,
    desc: "Khud-ba-khud lag jate hain. Aik din miss ho jaye to streak bach jata hai.",
  },
  { title: "Progress report", desc: "Topic-wise accuracy, weak words, weekly chart — aur har Pir ko email digest." },
  { title: "Mistakes review", desc: "Ghalat jawabon ka personal practice set — ek tap mein dobara practice." },
  { title: "PDF certificate", desc: "Naam, zubaan, level, tareekh aur verification code ke sath." },
  { title: "Offline lesson packs", desc: "Poori zubaan download karo aur bina internet parho." },
  {
    title: "Exclusive cosmetics",
    desc: `${COSMETIC_COUNTS.avatars} avatars, ${COSMETIC_COUNTS.frames} frames, ${COSMETIC_COUNTS.themes} themes + Premium badge.`,
  },
  { title: "2× daily coins", desc: "Roz ka chest double, plus ek extra premium chest." },
  { title: "Priority support", desc: "WhatsApp par seedha rabta — 12 ghante ke andar jawab." },
];

const TRUST = ["JazzCash", "EasyPaisa", "Visa", "Mastercard"];

export function PremiumClient() {
  const [plan, setPlan] = useState<PlanKey>("premium-yearly");
  const [trial, setTrial] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<PaymentsStatus | null>(null);
  const premium = usePlayer((s) => s.premium);
  const premiumExpiry = usePlayer((s) => s.premiumExpiry);
  const uid = usePlayer((s) => s.uid);

  useEffect(() => {
    let alive = true;
    fetch("/api/payments/status")
      .then((r) => r.json())
      .then((d: PaymentsStatus) => alive && setStatus(d))
      .catch(() => alive && setStatus({ anyConfigured: false, providers: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const providerReady = (id: string) => status?.providers.find((p) => p.id === id)?.configured ?? false;
  const paymentsOff = status !== null && !status.anyConfigured;

  const checkout = async (provider: "stripe" | "safepay") => {
    setBusy(provider);
    setError("");
    sfx("click");
    try {
      const res = await fetch(`/api/checkout/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan, uid, trial: plan === "premium-yearly" && trial }),
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
      {/* ------------------------------- hero ------------------------------- */}
      <div className="mb-8 max-w-2xl">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-accent-tint text-accent-ink">
          <Sparkles size={26} strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Premium</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          <b className="text-fg">Sab kuch free hai.</b> Saare 43 games, saare levels, saari 21 zubanein, leaderboard, XP,
          streak aur badges — hamesha, bina kisi daily limit ke. Premium content nahi kholta;{" "}
          <b className="text-fg">tajurba behtar banata hai</b> — ads nahi, unlimited hearts, reports, certificate.
        </p>
      </div>

      {premium && (
        <Card className="mb-6 flex flex-wrap items-center gap-3 border-brand bg-brand-tint p-4">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-surface text-brand-ink">
            <Sparkles size={20} strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold text-fg">Aap pehle se Premium ho — shukriya!</p>
            <p className="text-xs text-muted">
              {premiumExpiry ? `${premiumExpiry} tak active.` : "Active."} Manage ya cancel karne ke liye account page.
            </p>
          </div>
          <Link href="/account" className="btn btn-secondary btn-sm">
            Manage subscription
          </Link>
        </Card>
      )}

      {paymentsOff && (
        <Card className="mb-6 flex items-start gap-3 border-warning bg-warning-tint p-4">
          <Info size={18} strokeWidth={2.3} className="mt-0.5 shrink-0 text-warning-ink" />
          <div>
            <p className="text-sm font-bold text-fg">Payments abhi configure nahi hain</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Hum abhi online payment nahi le sakte — is liye hum aap ko aik toota hua button nahi dikha rahe. Free plan
              mein sab kuch waise hi chal raha hai. Support: salam@learnplaypk.com
            </p>
          </div>
        </Card>
      )}

      {/* ------------------------------ plans ------------------------------- */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* free */}
        <Card className="p-6">
          <p className="font-display text-lg font-extrabold text-fg">Free</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-black text-fg tnum">Rs. 0</span>
            <span className="text-sm text-muted">hamesha</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{PLANS.free.note}</p>
          <ul className="mt-5 grid gap-2 text-sm">
            {["Saare 43 games + 21 zubanein", "Koi daily limit nahi, koi level lock nahi", "XP, streak, badges, leaderboard", "Cloud progress sync", "Halke banner ads (consent ke baad)"].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-brand-ink" />
                <span className="text-muted">{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted">Aap abhi is par ho. Kuch karne ki zaroorat nahi.</p>
        </Card>

        {/* premium */}
        <Card className="border-brand p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-lg font-extrabold text-fg">Premium</p>
            {plan === "premium-yearly" && <Chip tone="brand">{PLANS["premium-yearly"].badge}</Chip>}
          </div>

          {/* plan switch — plain radios, no urgency */}
          <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Plan chuno">
            {(["premium-yearly", "premium-monthly"] as PlanKey[]).map((id) => {
              const p = PLANS[id];
              const selected = plan === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPlan(id)}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-start transition-colors ${
                    selected ? "border-brand bg-brand-tint" : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-fg">
                      {id === "premium-yearly" ? "Saalana" : "Mahana"}
                    </span>
                    <span className="block text-xs text-muted">
                      {id === "premium-yearly" ? `Rs. ${YEARLY_MONTHLY_EQUIV}/mah · ${YEARLY_SAVING_PCT}% bachat` : "Kabhi bhi cancel"}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="block font-display text-xl font-black text-fg tnum">
                      Rs. {p.amount.toLocaleString("en-PK")}
                    </span>
                    <span className="block text-[11px] text-muted">{p.periodLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {FEATURES.yearlyTrial && plan === "premium-yearly" && (
            <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 p-3 text-xs leading-relaxed text-muted">
              <input
                type="checkbox"
                checked={trial}
                onChange={(e) => setTrial(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-solid)]"
              />
              <span>
                <b className="text-fg">{TRIAL_DAYS_YEARLY}-din free trial se shuru karo.</b> Card ya wallet add karna
                zaroori hai, lekin trial ke doran kuch charge nahi hota. {TRIAL_DAYS_YEARLY} din ke andar cancel = zero
                payment.
              </span>
            </label>
          )}

          <ul className="mt-5 grid gap-2.5">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-fg">{f.title}</span>
                  <span className="block text-xs leading-relaxed text-muted">{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 grid gap-2">
            {providerReady("safepay") && (
              <Button size="lg" disabled={busy !== null || premium} onClick={() => checkout("safepay")}>
                {busy === "safepay" ? "Safepay khul raha…" : "JazzCash / EasyPaisa / Card"}
              </Button>
            )}
            {providerReady("stripe") && (
              <Button
                size="lg"
                variant="secondary"
                disabled={busy !== null || premium}
                onClick={() => checkout("stripe")}
              >
                {busy === "stripe" ? "Stripe khul raha…" : "International card — Stripe"}
              </Button>
            )}
            {status === null && <p className="text-xs text-muted">Payment options load ho rahe hain…</p>}
            {paymentsOff && (
              <p className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
                Online payment abhi band hai. Jaise hi chalu hoga, yahan button aa jayega.
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-danger/30 bg-danger-tint p-3 text-xs text-danger-ink">{error}</p>
          )}

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            Hum card details store nahi karte. Cancel kabhi bhi. Refund 7 din ke andar, bina sawal.
          </p>
        </Card>
      </div>

      {/* ------------------------------ trust ------------------------------- */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 p-3">
        <span className="text-xs text-muted">Payment methods:</span>
        {TRUST.map((t) => (
          <span
            key={t}
            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-bold tracking-wide text-muted"
          >
            {t}
          </span>
        ))}
      </div>

      {/* ---------------------------- comparison ---------------------------- */}
      <Card className="mt-8 overflow-x-auto p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-fg">Free vs Premium — poori list</h2>
        <p className="mb-4 mt-1 text-xs text-muted">
          Content ki har line dono taraf ✓ hai. Agar kabhi yahan free ke saamne &quot;locked&quot; likha dikhe, to hum
          apna wada tor rahe hain.
        </p>
        <table className="w-full text-start text-sm">
          <caption className="sr-only">Comparison of the free plan and Premium</caption>
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="py-2 font-bold">Feature</th>
              <th scope="col" className="py-2 text-center font-bold">Free</th>
              <th scope="col" className="py-2 text-center font-bold text-brand-ink">Premium</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r) => (
              <tr key={r.feature} className="border-t border-line">
                <th scope="row" className="py-2.5 pe-2 text-start font-semibold text-fg">{r.feature}</th>
                <td className="py-2.5 text-center text-muted">{r.free}</td>
                <td className="py-2.5 text-center font-bold text-fg">{r.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* -------------------------------- FAQ ------------------------------- */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-extrabold text-fg">Sawal jawab</h2>
        <div className="grid gap-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border border-line bg-surface p-4">
              <summary className="cursor-pointer list-none text-sm font-bold text-fg marker:hidden">
                {f.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/*
        Testimonials are intentionally omitted: we have no verified premium
        customers yet, and inventing quotes would be a lie.
      */}
      <p className="mt-8 text-center text-xs text-muted">
        Koi countdown nahi, koi &quot;sirf aaj&quot; nahi. Free plan hamesha rahega — jab dil kare upgrade karna.
      </p>
    </div>
  );
}
