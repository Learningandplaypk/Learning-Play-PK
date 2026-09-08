"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Brain, Clock, Download, Mail, Sparkles, Target } from "lucide-react";
import { Button, Card, Chip, EmptyState, Progress as Bar } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { accuracyByTopic, summarize, xpByDay } from "@/lib/progress-report";
import { weakWords } from "@/lib/mistakes";
import { getGameData } from "@/lib/games-data";
import { levelFromXp } from "@/lib/gamification";
import { canIssueCertificate, generateCertificatePdf } from "@/lib/certificate";
import { fmt, pktDayKey } from "@/lib/utils";
import { langLabel } from "@/lib/lang-paths";

function dayShort(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return ["Itwar", "Pir", "Mangal", "Budh", "Jumerat", "Juma", "Hafta"][d.getUTCDay()].slice(0, 3);
}

export function ProgressClient() {
  const results = usePlayer((s) => s.results);
  const mistakes = usePlayer((s) => s.mistakes);
  const premium = usePlayer((s) => s.premium);
  const streak = usePlayer((s) => s.streak);
  const xp = usePlayer((s) => s.xp);
  const name = usePlayer((s) => s.name);
  const uid = usePlayer((s) => s.uid);
  const [range, setRange] = useState<7 | 30>(7);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const summary = useMemo(() => summarize(results, range), [results, range]);
  const chart = useMemo(() => xpByDay(results, 7), [results]);
  const topics = useMemo(() => accuracyByTopic(results).slice(0, 12), [results]);
  const weak = useMemo(() => weakWords(mistakes, 10), [mistakes]);
  const level = levelFromXp(xp).level;
  const maxXp = Math.max(1, ...chart.map((c) => c.xp));

  const emailReport = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/report/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const d = (await res.json()) as { sent?: boolean; reason?: string };
      setMsg(d.sent ? "Report aap ke email par bhej di gayi." : `Email nahi ja saka: ${d.reason ?? "unknown"}.`);
    } catch {
      setMsg("Network issue — dobara koshish karo.");
    } finally {
      setBusy(false);
    }
  };

  const downloadCertificate = async () => {
    const check = canIssueCertificate(level, premium);
    if (!check.ok) {
      setMsg(check.reason ?? "");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const language = langLabel("english") ?? "English";
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, name, language, level }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string; code?: string };
      if (!d.ok) {
        setMsg(d.error ?? "Certificate abhi nahi ban saka.");
        return;
      }
      await generateCertificatePdf({
        name: name || "Learner",
        language,
        level,
        date: pktDayKey(),
        uid: uid ?? "guest",
      });
      setMsg(`Certificate download ho gaya. Verification code: ${d.code}`);
    } catch {
      setMsg("Certificate banate waqt masla hua.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length === 0) {
    return (
      <div className="container-page page-pad pb-24 pt-8">
        <EmptyState
          title="Abhi koi data nahi"
          body="Ek game khelo — phir yahan aap ki accuracy, weak words aur weekly chart nazar aayenge."
          action={
            <Link href="/learn" className="btn btn-primary">
              Seekhna shuru karo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint text-brand-ink">
            <BarChart3 size={26} strokeWidth={2.2} />
          </span>
          <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Aapki progress report</h1>
          <p className="mt-2 text-sm text-muted">
            Yeh basic report sab ke liye free hai. Premium par weekly email digest bhi aata hai.
          </p>
        </div>
        <div className="flex gap-2">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`min-h-9 rounded-lg border px-3 text-xs font-bold transition-colors ${
                range === r ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-surface text-muted"
              }`}
            >
              {r} din
            </button>
          ))}
        </div>
      </div>

      {/* summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Target size={18} strokeWidth={2.3} />, label: "Sessions", value: fmt(summary.plays) },
          { icon: <Sparkles size={18} strokeWidth={2.3} />, label: "XP", value: fmt(summary.xp) },
          { icon: <Clock size={18} strokeWidth={2.3} />, label: "Waqt (approx)", value: `${summary.minutes} min` },
          {
            icon: <Brain size={18} strokeWidth={2.3} />,
            label: "Average accuracy",
            value: `${Math.round(summary.avgAccuracy * 100)}%`,
          },
        ].map((t) => (
          <Card key={t.label} className="p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-muted">{t.icon}</span>
            <p className="mt-3 font-display text-2xl font-black text-fg tnum">{t.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted">{t.label}</p>
          </Card>
        ))}
      </div>

      {/* weekly chart */}
      <Card className="mt-5 p-5">
        <h2 className="font-display text-base font-extrabold text-fg">Pichlay 7 din</h2>
        <div className="mt-4 flex h-40 items-end gap-2" role="img" aria-label="Weekly XP chart">
          {chart.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted tnum">{d.xp || ""}</span>
              <div
                className="w-full rounded-t-md bg-brand-solid transition-all"
                style={{ height: `${Math.max(3, (d.xp / maxXp) * 100)}%` }}
                title={`${d.day}: ${d.xp} XP`}
              />
              <span className="text-[10px] text-muted">{dayShort(d.day)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Streak: <b className="text-fg">{streak} din</b>
          {summary.bestDay && summary.bestDay.xp > 0 ? ` · Sab se acha din: ${summary.bestDay.day}` : ""}
        </p>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* accuracy by topic */}
        <Card className="p-5">
          <h2 className="font-display text-base font-extrabold text-fg">Topic ke hisab se accuracy</h2>
          <ul className="mt-4 grid gap-3">
            {topics.map((t) => (
              <li key={t.slug}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-fg">{getGameData(t.slug)?.title ?? t.slug}</span>
                  <span className="shrink-0 text-muted tnum">
                    {Math.round(t.accuracy * 100)}% · {t.plays}×
                  </span>
                </div>
                <Bar value={t.accuracy * 100} label={`${t.slug} accuracy`} />
              </li>
            ))}
          </ul>
        </Card>

        {/* weak words */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-extrabold text-fg">Weak words</h2>
            {weak.length > 0 && (
              <Link href="/mistakes" className="btn btn-secondary btn-sm">
                Practice karo
              </Link>
            )}
          </div>
          {weak.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Koi ghalti record nahi — shabash! Jab kuch ghalat hoga, woh yahan practice ke liye aa jayega.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {weak.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-fg">{m.prompt}</span>
                    <span className="block truncate text-xs text-muted">Sahi: {m.correct}</span>
                  </span>
                  <Chip tone="neutral">{m.misses}×</Chip>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* premium extras */}
      <Card className={`mt-5 p-5 ${premium ? "border-brand" : ""}`}>
        <h2 className="font-display text-base font-extrabold text-fg">
          {premium ? "Premium report tools" : "Premium report tools (abhi band)"}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {premium
            ? "Weekly email digest aur PDF certificate aap ke liye khule hain."
            : "Weekly email digest aur PDF certificate Premium mein aate hain. Upar wali saari report free hai aur free rahegi."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={!premium || busy} onClick={emailReport}>
            <Mail size={15} strokeWidth={2.2} /> Email par bhejo
          </Button>
          <Button size="sm" variant="secondary" disabled={!premium || busy} onClick={downloadCertificate}>
            <Download size={15} strokeWidth={2.2} /> Certificate (PDF)
          </Button>
          {!premium && (
            <Link href="/premium" className="btn btn-primary btn-sm">
              Premium dekho
            </Link>
          )}
        </div>
        {msg && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-muted">{msg}</p>}
      </Card>
    </div>
  );
}
