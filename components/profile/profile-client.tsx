"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Download,
  Flame,
  Gamepad2,
  LogIn,
  LogOut,
  Moon,
  Pencil,
  RotateCcw,
  Settings,
  Snowflake,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Button, Card, Chip, Modal, Progress, Sheet, StatTile, Tabs } from "@/components/ui";
import { usePlayer, AVATAR_CHOICES, playerSnapshot, type LangKey } from "@/lib/store";
import { levelFromXp, levelTitle, DAILY_REWARDS } from "@/lib/gamification";
import { BADGES } from "@/data/badges";
import { fmt, pktDayKey, pktDayOffset } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`Level ${level}`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 300ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-black text-fg tnum">{level}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Level</span>
      </div>
    </div>
  );
}

function WeeklyBars() {
  const results = usePlayer((s) => s.results);
  const days = useMemo(() => {
    const today = pktDayKey();
    return Array.from({ length: 7 }, (_, i) => {
      const key = pktDayOffset(-(6 - i), today);
      const count = results.filter((r) => pktDayKey(new Date(r.at)) === key).length;
      return { key, count, label: new Date(`${key}T07:00:00Z`).toLocaleDateString("en-PK", { weekday: "short" }) };
    });
  }, [results]);
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="flex items-end justify-between gap-2 pt-2">
      {days.map((d) => (
        <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-20 w-full items-end">
            <div
              className="w-full rounded-md"
              style={{
                height: `${Math.max(6, (d.count / max) * 100)}%`,
                background: d.count > 0 ? "var(--brand)" : "var(--surface-2)",
                border: d.count > 0 ? "none" : "1px solid var(--border)",
              }}
              title={`${d.count} games`}
            />
          </div>
          <span className="text-[10px] font-semibold text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfileClient() {
  const s = usePlayer();
  const { user, configured, logout } = useAuth();
  const { choice, setChoice } = useTheme();
  const { setLang } = useI18n();
  const lv = levelFromXp(s.xp);

  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [avatars, setAvatars] = useState(false);
  const today = pktDayKey();

  const earned = useMemo(() => BADGES.filter((b) => s.badges.includes(b.id)), [s.badges]);
  const recent = s.results.slice(0, 6);
  const rewardAvailable = s.lastRewardDay !== today;

  const claim = () => {
    const reward = s.claimDailyReward();
    if (reward) {
      s.toast("🎁", `Daily reward: ${reward.label} mila!`, reward.freeze ? "+1 streak freeze bhi" : "Kal phir aana");
    }
  };

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
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      {/* ------------------------------ header ------------------------------ */}
      <Card className="mb-4 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <LevelRing level={lv.level} progress={lv.progress} />
          <div className="min-w-0 flex-1">
            {editName ? (
              <div className="flex gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Naam likho"
                  aria-label="Display name"
                  className="field max-w-[220px]"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    s.setPlayer({ name: nameDraft.slice(0, 24) });
                    setEditName(false);
                  }}
                >
                  Save
                </Button>
              </div>
            ) : (
              <h1 className="flex items-center gap-2 font-display text-2xl font-black text-fg">
                <span className="truncate">{s.name || (user ? user.name : "Khiladi")}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(s.name || user?.name || "");
                    setEditName(true);
                  }}
                  aria-label="Naam badlo"
                  className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <Pencil size={15} strokeWidth={2.2} />
                </button>
              </h1>
            )}
            <p className="mt-0.5 text-sm font-bold text-brand-ink">{levelTitle(lv.level)}</p>
            <div className="mt-3 max-w-sm">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span className="tnum">{fmt(lv.into)} XP</span>
                <span className="tnum">
                  {lv.need > 0 ? `${fmt(lv.need - lv.into)} XP → Lv ${lv.level + 1}` : "MAX"}
                </span>
              </div>
              <Progress value={lv.progress * 100} label={`Level ${lv.level} progress`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone="accent">
                <Flame size={13} strokeWidth={2.4} /> {s.streak} din
              </Chip>
              <Chip>
                <Coins size={13} strokeWidth={2.4} /> {fmt(s.coins)}
              </Chip>
              <Chip>
                <Snowflake size={13} strokeWidth={2.4} /> {s.freezes}
              </Chip>
              <Chip>
                <Sparkles size={13} strokeWidth={2.4} /> {s.hints} hints
              </Chip>
              {s.premium && (
                <Chip tone="brand">
                  <Trophy size={13} strokeWidth={2.4} /> Premium
                </Chip>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={claim}
            disabled={!rewardAvailable}
            className={`card w-full shrink-0 p-4 text-start transition-colors hover:border-brand disabled:opacity-60 sm:max-w-[190px] ${rewardAvailable ? "chest-open" : ""}`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-tint text-accent-ink">
              <Sparkles size={20} strokeWidth={2.4} />
            </span>
            <span className="mt-2 block font-display text-sm font-extrabold text-fg">
              {rewardAvailable ? "Daily chest kholo" : "Aaj ka chest mil gaya"}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Day {(s.rewardCycleDay % 7) + 1}/7 — {DAILY_REWARDS[s.rewardCycleDay % 7].label}
            </span>
          </button>
        </div>
      </Card>

      {/* ------------------------------ stats ------------------------------- */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile icon={<Zap size={20} strokeWidth={2.4} />} value={fmt(s.xp)} label="Total XP" tone="brand" />
        <StatTile icon={<Flame size={20} strokeWidth={2.4} />} value={s.streak} label="Day streak" tone="accent" />
        <StatTile icon={<Gamepad2 size={20} strokeWidth={2.4} />} value={s.results.length} label="Games played" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* weekly activity */}
        <Card className="p-5">
          <h2 className="font-display text-base font-extrabold text-fg">Is hafte ki activity</h2>
          <p className="mb-3 text-xs text-muted">Pichle 7 din — kitne games khele</p>
          <WeeklyBars />
        </Card>

        {/* badges */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-fg">
              <Trophy size={18} strokeWidth={2.4} className="text-brand-ink" /> Trophy room
            </h2>
            <span className="text-xs text-muted tnum">
              {earned.length}/{BADGES.length}
            </span>
          </div>
          <Progress value={(earned.length / BADGES.length) * 100} className="mb-4" label={`Badges earned: ${earned.length} of ${BADGES.length}`} />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {BADGES.map((b) => {
              const owned = s.badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  title={`${b.name} — ${b.desc}`}
                  className={`grid aspect-square place-items-center rounded-xl border text-xl transition ${
                    owned ? "border-brand/40 bg-brand-tint" : "border-line bg-surface-2 opacity-40 grayscale"
                  }`}
                >
                  {b.emoji}
                </div>
              );
            })}
          </div>
        </Card>

        {/* recent */}
        <Card className="p-5">
          <h2 className="font-display text-base font-extrabold text-fg">Recent games</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Abhi koi game nahi khela — chalo shuru karein!</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-xs text-muted">
                    {new Date(r.at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-fg">{r.slug.replace(/-/g, " ")}</span>
                  <span className="font-bold text-brand-ink tnum">+{r.xp}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* settings */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-extrabold text-fg">
            <Settings size={18} strokeWidth={2.4} className="text-brand-ink" /> Settings
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Theme</p>
              <Tabs<ThemeChoice>
                tabs={[
                  { id: "light", label: "Light" },
                  { id: "dark", label: "Dark" },
                  { id: "system", label: "System" },
                ]}
                value={choice}
                onChange={setChoice}
              />
              <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Lite mode</p>
              <button
                type="button"
                onClick={() => s.setPlayer({ lowQuality: !s.lowQuality })}
                aria-pressed={s.lowQuality}
                className={`filter-chip ${s.lowQuality ? "" : ""}`}
                style={
                  s.lowQuality
                    ? { background: "var(--brand-tint)", borderColor: "var(--brand)", color: "var(--brand-ink)" }
                    : undefined
                }
              >
                {s.lowQuality ? "Lite mode ON" : "Lite mode OFF"}
              </button>
              <p className="mt-1.5 text-xs text-muted">Kamzor phone par 3D band karke sab kuch tez chalta hai.</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Sound</p>
              <button
                type="button"
                onClick={() => s.setPlayer({ sound: !s.sound })}
                aria-pressed={s.sound}
                className="filter-chip"
                style={
                  s.sound
                    ? { background: "var(--brand-tint)", borderColor: "var(--brand)", color: "var(--brand-ink)" }
                    : undefined
                }
              >
                {s.sound ? <Volume2 size={15} strokeWidth={2.2} /> : <VolumeX size={15} strokeWidth={2.2} />}
                {s.sound ? "Sound on" : "Sound off"}
              </button>

              <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Language / زبان</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["en", "English"],
                    ["roman", "Roman Urdu"],
                    ["ur", "اردو"],
                  ] as Array<[LangKey, string]>
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => s.setPlayer({ lang: k })}
                    className="filter-chip"
                    aria-pressed={s.lang === k}
                    style={
                      s.lang === k
                        ? { background: "var(--brand-tint)", borderColor: "var(--brand)", color: "var(--brand-ink)" }
                        : undefined
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Avatar</p>
              <button type="button" onClick={() => setAvatars(true)} className="btn btn-secondary btn-sm">
                Avatar badlo ({s.avatar})
              </button>
            </div>

            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Account & data</p>
              <div className="flex flex-wrap gap-2">
                {user ? (
                  <Button size="sm" variant="secondary" onClick={() => logout()}>
                    <LogOut size={15} strokeWidth={2.2} /> Logout
                  </Button>
                ) : configured ? (
                  <Link href="/login" className="btn btn-secondary btn-sm">
                    <LogIn size={15} strokeWidth={2.2} /> Login / Signup
                  </Link>
                ) : (
                  <Chip>Guest mode — Firebase setup pending</Chip>
                )}
                <Button size="sm" variant="secondary" onClick={downloadSnapshot}>
                  <Download size={15} strokeWidth={2.2} /> Progress download
                </Button>
                {!s.premium && (
                  <Link href="/premium" className="btn btn-primary btn-sm">
                    <Trophy size={15} strokeWidth={2.2} /> Premium
                  </Link>
                )}
                <Button size="sm" variant="ghost" onClick={() => setResetConfirm(true)}>
                  <Trash2 size={15} strokeWidth={2.2} /> Progress reset
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* avatar sheet */}
      <Sheet open={avatars} onClose={() => setAvatars(false)} title="Avatar chuno">
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_CHOICES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                s.setPlayer({ avatar: a });
                setAvatars(false);
              }}
              className={`grid aspect-square place-items-center rounded-xl border text-2xl ${
                s.avatar === a ? "border-brand bg-brand-tint" : "border-line bg-surface-2"
              }`}
              aria-label={`Avatar ${a}`}
              aria-pressed={s.avatar === a}
            >
              {a}
            </button>
          ))}
        </div>
      </Sheet>

      {/* reset confirm */}
      <Modal open={resetConfirm} onClose={() => setResetConfirm(false)} title="Pakka reset karna hai?">
        <p className="text-sm leading-relaxed text-muted">
          Saara XP, coins, badges aur history delete ho jayegi. Yeh wapis nahi aata.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setResetConfirm(false)}>
            Nahi
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              s.resetProgress();
              setResetConfirm(false);
              s.toast("🗑️", "Progress reset ho gaya", "Naya safar shuru!");
            }}
          >
            <RotateCcw size={16} strokeWidth={2.2} /> Haan, reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
