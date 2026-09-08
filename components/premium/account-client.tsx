"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, CreditCard, LifeBuoy, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Card, Chip } from "@/components/ui";
import { usePlayer, applyEntitlement } from "@/lib/store";
import { entitlementStatus, monthlyAllowance } from "@/lib/entitlements";
import { PLANS, GRACE_DAYS } from "@/lib/plans";
import { FRAMES, PREMIUM_AVATARS, THEME_SKINS } from "@/lib/cosmetics";
import { supportWhatsAppUrl } from "@/lib/support";

/** Manage subscription + premium cosmetics. */
export function AccountClient() {
  const s = usePlayer();
  const [checking, setChecking] = useState(false);
  const status = entitlementStatus({
    isPremium: s.premium,
    premiumExpiry: s.premiumExpiry,
    premiumPlan: s.premiumPlan,
    trialEnd: s.trialEnd,
  });
  const allowance = monthlyAllowance(s.allowance, status.active);
  const support = supportWhatsAppUrl("Salam! Mujhe premium ke baare mein madad chahiye.");

  const refresh = async () => {
    if (!s.uid || s.uid.startsWith("guest")) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/entitlement?uid=${encodeURIComponent(s.uid)}`);
      const d = await res.json();
      applyEntitlement({
        isPremium: !!d.active,
        premiumExpiry: d.expiry ?? null,
        premiumPlan: d.plan ?? null,
        premiumProvider: d.provider ?? null,
      });
    } catch {
      /* offline — keep the local mirror */
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planName = status.plan && PLANS[status.plan as keyof typeof PLANS]?.name;

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Account</h1>
      <p className="mt-2 text-sm text-muted">Subscription, cosmetics aur support — sab yahan.</p>

      {/* subscription */}
      <Card className={`mt-6 p-5 ${status.active ? "border-brand" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-extrabold text-fg">
              <Sparkles size={18} strokeWidth={2.3} className="text-accent-ink" />
              {status.active ? planName ?? "Premium" : "Free plan"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {status.active
                ? status.trialing
                  ? `Free trial ${status.expiry} tak. Us se pehle cancel karo to koi charge nahi.`
                  : status.inGrace
                    ? `Renewal pending — ${GRACE_DAYS} din ka grace chal raha hai. Premium abhi chalu hai.`
                    : `${status.expiry ?? "—"} tak active${status.daysLeft !== null ? ` (${status.daysLeft} din baqi)` : ""}.`
                : "Aap free plan par ho — aur free plan mein sab kuch khula hai."}
            </p>
            {s.premiumProvider && (
              <p className="mt-1 text-xs text-muted">Payment method: {s.premiumProvider}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={refresh} disabled={checking}>
              {checking ? "Check ho raha…" : "Status refresh"}
            </Button>
            {!status.active && (
              <Link href="/premium" className="btn btn-primary btn-sm">
                Premium dekho
              </Link>
            )}
          </div>
        </div>

        {status.active && (
          <div className="mt-4 grid gap-2 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-muted">
            <p className="flex items-start gap-2">
              <CalendarClock size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              Is mahine: <b className="text-fg">{allowance.freezesLeft}</b> streak freeze aur{" "}
              <b className="text-fg">{allowance.repairsLeft}</b> repair baqi. Yeh khud-ba-khud lagte hain.
            </p>
            <p className="flex items-start gap-2">
              <CreditCard size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              Cancel karna ho to <a className="font-semibold text-brand-ink underline" href="mailto:salam@learnplaypk.com">salam@learnplaypk.com</a> par ek line likh do — ya apne
              Safepay/Stripe receipt email se billing portal khol lo. Cancel ke baad bhi paid period khatam hone tak
              premium chalta rahega.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              Refund: pehle 7 din ke andar poora, bina kisi sawal ke.
            </p>
          </div>
        )}
      </Card>

      {/* cosmetics */}
      <Card className="mt-5 p-5">
        <p className="flex items-center gap-2 font-display text-base font-extrabold text-fg">
          <Palette size={17} strokeWidth={2.3} /> Cosmetics
        </p>
        <p className="mt-1 text-xs text-muted">
          Sirf dikhawa — inse XP, coins ya ranking par koi farq nahi parta.
        </p>

        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Premium avatars</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PREMIUM_AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={!status.active}
              onClick={() => usePlayer.setState({ avatar: a.emoji })}
              title={a.name}
              className={`grid h-12 w-12 place-items-center rounded-xl border text-2xl transition-colors disabled:opacity-40 ${
                s.avatar === a.emoji ? "border-brand bg-brand-tint" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              {a.emoji}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">Frames</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={f.premium && !status.active}
              onClick={() => usePlayer.setState({ frame: f.id })}
              className={`min-h-10 rounded-lg border px-3 text-xs font-bold transition-colors disabled:opacity-40 ${
                s.frame === f.id ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-surface text-muted"
              }`}
            >
              {f.name}
              {f.premium && <span className="ms-1 text-accent-ink">★</span>}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">Themes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_SKINS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={t.premium && !status.active}
              onClick={() => usePlayer.setState({ themeSkin: t.id })}
              className={`min-h-10 rounded-lg border px-3 text-start text-xs font-bold transition-colors disabled:opacity-40 ${
                s.themeSkin === t.id ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-surface text-muted"
              }`}
            >
              {t.name}
              {t.premium && <span className="ms-1 text-accent-ink">★</span>}
              <span className="block text-[10px] font-normal opacity-80">{t.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* support */}
      <Card className="mt-5 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="flex items-center gap-2 font-display text-base font-extrabold text-fg">
            <LifeBuoy size={17} strokeWidth={2.3} /> Support
          </p>
          <p className="mt-1 text-xs text-muted">
            {status.active
              ? "Premium members ko WhatsApp par priority support — 12 ghante ke andar jawab."
              : "Free support email par — 48 ghante ke andar jawab."}
          </p>
        </div>
        <div className="flex gap-2">
          {status.active && support && (
            <a className="btn btn-primary btn-sm" href={support} target="_blank" rel="noopener noreferrer">
              WhatsApp par likho
            </a>
          )}
          <a className="btn btn-secondary btn-sm" href="mailto:salam@learnplaypk.com">
            Email
          </a>
        </div>
      </Card>

      {status.active && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip tone="brand">Premium active</Chip>
          <Link href="/progress" className="btn btn-secondary btn-sm">Progress report</Link>
          <Link href="/downloads" className="btn btn-secondary btn-sm">Offline packs</Link>
        </div>
      )}
    </div>
  );
}
