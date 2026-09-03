"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Progress, TiltCard, Modal } from "@/components/ui";
import { usePlayer, AVATAR_CHOICES, playerSnapshot, type LangKey } from "@/lib/store";
import { levelFromXp, levelTitle, DAILY_REWARDS } from "@/lib/gamification";
import { BADGES } from "@/data/badges";
import { fmt, pktDayKey } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { AuthBackground } from "@/components/auth/auth-bg";

function RadarChart({ values }: { values: number[] }) {
  // 5-axis radar: learn, brain, quiz, fun, streak
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const max = 5;
  const pt = (i: number, v: number) => {
    const ang = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    const r = (Math.min(v, max) / max) * (size / 2 - 22);
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  };
  const poly = values.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-44" role="img" aria-label="Progress radar chart">
      {[1, 2, 3, 4, 5].map((ring) => (
        <polygon
          key={ring}
          points={values.map((_, i) => pt(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      <polygon points={poly} fill="rgba(57,255,20,0.18)" stroke="#39ff14" strokeWidth="1.6" />
      {["📚", "🧠", "❓", "🎮", "🔥"].map((e, i) => {
        const [x, y] = pt(i, max + 0.65);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11">
            {e}
          </text>
        );
      })}
    </svg>
  );
}

export function ProfileClient() {
  const s = usePlayer();
  const { user, configured, logout } = useAuth();
  const lv = levelFromXp(s.xp);
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(s.name);
  const [resetConfirm, setResetConfirm] = useState(false);
  const today = pktDayKey();

  const zoneScores = useMemo(() => {
    const zones = { learn: 0, brain: 0, quiz: 0, fun: 0 };
    s.results.forEach((r) => {
      zones[r.zone] += r.score;
    });
    const mx = Math.max(1, ...Object.values(zones));
    return [
      zones.learn / mx,
      zones.brain / mx,
      zones.quiz / mx,
      zones.fun / mx,
      Math.min(5, s.streak),
    ];
  }, [s.results, s.streak]);

  const recent = s.results.slice(0, 6);
  const earned = BADGES.filter((b) => s.badges.includes(b.id));

  const claim = () => {
    const reward = s.claimDailyReward();
    if (reward) {
      s.toast("🎁", `Daily reward: ${reward.label} mila!`, reward.freeze ? "+1 streak freeze bhi" : "Kal phir aana — cycle day " + (s.rewardCycleDay % 7 === 0 ? 7 : s.rewardCycleDay));
    }
  };

  const rewardAvailable = s.lastRewardDay !== today;

  const downloadSnapshot = () => {
    const blob = new Blob([JSON.stringify(playerSnapshot(s), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learnplay-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative page-pad mx-auto min-h-[100dvh] max-w-5xl pb-28 pt-28">
      <AuthBackground />
      <div className="relative z-10">
        {/* header card */}
        <TiltCard className="mb-6 overflow-hidden p-6 sm:p-8" intensity={5}>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-electric/40 via-neon-purple/35 to-neon-green/35 text-5xl shadow-[0_0_40px_-8px_rgba(45,124,255,.7)]">
                {s.avatar}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-neon-green to-electric px-3 py-0.5 font-display text-[11px] font-black text-black">
                LV {lv.level}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              {editName ? (
                <div className="flex gap-2">
                  <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Naam likho" aria-label="Display name" />
                  <Button
                    size="sm"
                    onClick={() => {
                      s.setPlayer({ name: nameDraft.slice(0, 24) });
                      setEditName(false);
                    }}
                  >
                    ✔
                  </Button>
                </div>
              ) : (
                <h1 className="font-display text-2xl font-black">
                  {s.name || (user ? user.name : "Khiladi")}{" "}
                  <button onClick={() => { setNameDraft(s.name || (user?.name ?? "")); setEditName(true); }} className="text-sm text-electric hover:underline" aria-label="Naam badlo">
                    ✏️
                  </button>
                </h1>
              )}
              <p className="text-sm font-bold text-neon-green">{levelTitle(lv.level)}</p>
              <div className="mt-3 max-w-sm">
                <div className="mb-1 flex justify-between text-[11px] text-muted">
                  <span>{fmt(lv.into)} XP</span>
                  <span>{lv.need > 0 ? `${fmt(lv.need - lv.into)} XP → Lv ${lv.level + 1}` : "MAX"}</span>
                </div>
                <Progress value={lv.progress * 100} />
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="chip">🪙 {fmt(s.coins)}</span>
                <span className="chip">🔥 {s.streak} day streak</span>
                <span className="chip">❄️ {s.freezes} freezes</span>
                <span className="chip">💡 {s.hints} hints</span>
                {s.premium && <span className="chip border-neon-orange/50 text-neon-orange">👑 Premium{s.premiumExpiry ? ` — ${s.premiumExpiry} tak` : ""}</span>}
              </div>
            </div>
            {/* daily reward chest */}
            <button
              onClick={claim}
              disabled={!rewardAvailable}
              className={`glass glass-hover w-full max-w-[180px] p-4 text-center transition ${rewardAvailable ? "animate-pulse-glow border-neon-green/50" : "opacity-60"}`}
              aria-label="Daily reward kholo"
            >
              <div className="text-4xl">{rewardAvailable ? "🎁" : "chest khol di 📦"}</div>
              <div className="mt-2 font-display text-sm font-bold">{rewardAvailable ? "Daily Chest — kholo!" : "Aaj ka chest khul gaya"}</div>
              <div className="mt-1 text-[10px] text-muted">
                Day {(s.rewardCycleDay % 7) + 1}/7 — {DAILY_REWARDS[s.rewardCycleDay % 7].label}
              </div>
            </button>
          </div>
        </TiltCard>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* stats + radar */}
          <TiltCard className="p-6">
            <h3 className="mb-3 font-display font-bold">📈 Stats</h3>
            <RadarChart values={zoneScores} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
              <div className="glass p-2.5">
                <div className="font-display text-lg font-black">{s.results.length}</div>
                <div className="text-[10px] uppercase text-muted">Games</div>
              </div>
              <div className="glass p-2.5">
                <div className="font-display text-lg font-black">{s.wordsLearned.length}</div>
                <div className="text-[10px] uppercase text-muted">Words</div>
              </div>
              <div className="glass p-2.5">
                <div className="font-display text-lg font-black">{s.quizCorrect}</div>
                <div className="text-[10px] uppercase text-muted">Quiz ✅</div>
              </div>
              <div className="glass p-2.5">
                <div className="font-display text-lg font-black">{s.perfectScores}</div>
                <div className="text-[10px] uppercase text-muted">Perfect</div>
              </div>
            </div>
          </TiltCard>

          {/* badges trophy room */}
          <TiltCard className="p-6 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-bold">🏆 Trophy Room</h3>
              <span className="text-xs text-muted">{earned.length}/{BADGES.length}</span>
            </div>
            <Progress value={(earned.length / BADGES.length) * 100} className="mb-4" />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {BADGES.map((b) => {
                const owned = s.badges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    title={`${b.name} — ${b.desc}`}
                    className={`grid aspect-square place-items-center rounded-2xl border text-2xl transition ${
                      owned ? "border-neon-green/50 bg-neon-green/10 shadow-[0_0_18px_-6px_rgba(57,255,20,.8)]" : "border-white/8 bg-white/[0.03] opacity-30 grayscale"
                    }`}
                  >
                    {b.emoji}
                  </div>
                );
              })}
            </div>
          </TiltCard>

          {/* recent games */}
          <TiltCard className="p-6">
            <h3 className="mb-3 font-display font-bold">🕹️ Recent Games</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-muted">Abhi koi game nahi khela — chalo shuru karein!</p>
            ) : (
              <ul className="space-y-2">
                {recent.map((r, i) => (
                  <li key={i} className="glass flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-muted">{new Date(r.at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
                    <span className="font-bold">{r.slug}</span>
                    <span className="text-neon-green">+{r.xp} XP</span>
                  </li>
                ))}
              </ul>
            )}
          </TiltCard>

          {/* settings */}
          <TiltCard className="p-6 lg:col-span-2">
            <h3 className="mb-4 font-display font-bold">⚙️ Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Avatar</p>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_CHOICES.map((a) => (
                    <button
                      key={a}
                      onClick={() => s.setPlayer({ avatar: a })}
                      className={`grid h-10 w-10 place-items-center rounded-xl border text-xl transition ${s.avatar === a ? "border-neon-green bg-neon-green/15" : "border-white/10 hover:border-white/30"}`}
                      aria-label={`Avatar ${a}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Language / زبان</p>
                <div className="flex gap-2">
                  {([["en", "English"], ["roman", "Roman Urdu"], ["ur", "اردو"]] as Array<[LangKey, string]>).map(([k, label]) => (
                    <button key={k} onClick={() => s.setPlayer({ lang: k })} className={`chip cursor-pointer ${s.lang === k ? "border-electric/60 text-ink" : ""}`} aria-pressed={s.lang === k}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Sound</p>
                <button className={`chip cursor-pointer ${s.sound ? "border-neon-green/50 text-neon-green" : ""}`} onClick={() => s.setPlayer({ sound: !s.sound })} aria-pressed={s.sound}>
                  {s.sound ? "🔊 ON" : "🔇 OFF"}
                </button>
                <span className="ml-2">
                  <button className={`chip cursor-pointer ${s.lowQuality ? "border-neon-orange/50 text-neon-orange" : ""}`} onClick={() => s.setPlayer({ lowQuality: !s.lowQuality })} aria-pressed={s.lowQuality}>
                    {s.lowQuality ? "🪫 Low graphics ON" : "🔋 Low graphics OFF"}
                  </button>
                </span>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Account & Data</p>
                <div className="flex flex-wrap gap-2">
                  {user ? (
                    <Button size="sm" variant="ghost" onClick={() => logout()}>🚪 Logout</Button>
                  ) : configured ? (
                    <Link href="/login" className="btn btn-ghost btn-sm">🔑 Login / Signup</Link>
                  ) : (
                    <span className="chip">👤 Guest mode (Firebase setup pending)</span>
                  )}
                  <Button size="sm" variant="ghost" onClick={downloadSnapshot}>💾 Progress download</Button>
                  {!s.premium && <Link href="/premium" className="btn btn-neon btn-sm">👑 Premium</Link>}
                  <Button size="sm" variant="ghost" onClick={() => setResetConfirm(true)}>🗑️ Progress reset</Button>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>

      <Modal open={resetConfirm} onClose={() => setResetConfirm(false)}>
        <div className="text-center">
          <div className="text-4xl">⚠️</div>
          <h3 className="mt-2 font-display text-xl font-black">Pakka reset karna hai?</h3>
          <p className="mt-2 text-sm text-muted">Saara XP, coins, badges aur history delete ho jayegi. Yeh wapis nahi aata.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setResetConfirm(false)}>
              Nahi
            </Button>
            <Button
              variant="pink"
              className="flex-1"
              onClick={() => {
                s.resetProgress();
                setResetConfirm(false);
                s.toast("🗑️", "Progress reset ho gaya", "Naya safar shuru!");
              }}
            >
              Haan, reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
