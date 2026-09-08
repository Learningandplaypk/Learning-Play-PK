"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, Link2, MessageCircle, RotateCcw, Share2, Sparkles, Star } from "lucide-react";
import { Button, Card, Chip, Progress, useCountUp } from "./ui";
import { AdSlot } from "./ads";
import { GameOverPremiumNote } from "./premium/premium-nudge";
import { HeartsBar } from "./hearts-bar";
import { usePlayer, type Zone } from "@/lib/store";
import { levelFromXp, levelTitle, xpForGame } from "@/lib/gamification";
import { pushProgressToFirestore } from "@/lib/sync";
import { sfx } from "@/lib/sfx";
import { fmt } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { burstConfetti, flyCoins } from "@/lib/celebrate";
import type { GameData } from "@/lib/games-data";
import { ALL_GAME_DATA } from "@/lib/games-data";
import { ZoneArt } from "@/components/brand/ustad";

export type GameResult = {
  score: number;
  maxScore: number;
  accuracy: number;
  timeMs: number;
  flag?: string;
  words?: string[];
  quizCorrect?: number;
};

export type GameProps = {
  lang?: string;
  onEnd: (result: GameResult) => void;
};

export type GameMeta = GameData & { load: React.ComponentType<GameProps> };

function ShareRow({ title, scoreText }: { title: string; scoreText: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = `${scoreText} — ${title} par! Learn & Play PK se khelo: `;

  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Learn & Play PK", text: text + url, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await copy();
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text + url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button size="sm" onClick={native}>
        <Share2 size={16} strokeWidth={2.2} /> Share
      </Button>
      <a
        className="btn btn-secondary btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(text + url)}`}
      >
        <MessageCircle size={16} strokeWidth={2.2} /> WhatsApp
      </a>
      <Button size="sm" variant="secondary" onClick={copy}>
        <Link2 size={16} strokeWidth={2.2} /> {copied ? "Copied!" : "Copy link"}
      </Button>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div role="img" className="flex items-center justify-center gap-1" aria-label={`${value} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={26}
          strokeWidth={2}
          className={i <= value ? "star-fill text-accent" : "text-[var(--border)]"}
          style={i <= value ? { animationDelay: `${(i - 1) * 140}ms` } : undefined}
          fill={i <= value ? "var(--accent)" : "none"}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function GameShell({ meta, lang, backHref }: { meta: GameMeta; lang?: string; backHref?: string }) {
  const { t } = useI18n();
  const phase = useMemo(() => new PhaseMachine(), []);
  const [, force] = useState(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [outcome, setOutcome] = useState<ReturnType<ReturnType<typeof usePlayer.getState>["submitGame"]> | null>(null);
  const submitGame = usePlayer((s) => s.submitGame);
  const premium = usePlayer((s) => s.premium);
  const xp = usePlayer((s) => s.xp);
  const streak = usePlayer((s) => s.streak);
  const coins = usePlayer((s) => s.coins);
  const best = usePlayer((s) => {
    const rows = s.results.filter((r) => r.slug === meta.slug);
    return rows.length ? Math.max(...rows.map((r) => r.score)) : 0;
  });

  useEffect(() => () => phase.dispose(), [phase]);

  // No limits: a game always starts. There is nothing to check.
  const start = useCallback(() => {
    sfx("whoosh");
    phase.set("playing");
    force((n) => n + 1);
  }, [phase]);

  const handleEnd = useCallback(
    (result: GameResult) => {
      const o = submitGame({
        slug: meta.slug,
        zone: meta.zone,
        result,
        flag: result.flag,
        words: result.words,
        quizCorrect: result.quizCorrect,
      });
      setOutcome(o);
      setLastResult(result);
      phase.set("over");
      force((n) => n + 1);
      void pushProgressToFirestore(o);
      const q = result.maxScore > 0 ? result.score / result.maxScore : 0;
      if (q >= 0.6) {
        sfx("win");
        void burstConfetti(0.65);
        window.setTimeout(() => {
          const coin = document.getElementById("game-over-coins");
          flyCoins(coin?.getBoundingClientRect() ?? null);
        }, 400);
      } else {
        sfx("lose");
      }
    },
    [meta.slug, meta.zone, phase, submitGame]
  );

  const Game = meta.load;
  const lv = levelFromXp(xp);
  const back = backHref ?? (meta.zone === "learn" ? `/learn${lang ? `/${lang}` : "/english"}` : `/${meta.zone}`);
  const scoreText = lastResult ? `Maine ${fmt(lastResult.score)} score kiya` : "";

  const nextGame = useMemo(() => {
    const sameZone = ALL_GAME_DATA.filter((g) => g.zone === meta.zone);
    const i = sameZone.findIndex((g) => g.slug === meta.slug);
    return sameZone[(i + 1) % sameZone.length];
  }, [meta.slug, meta.zone]);
  const nextHref =
    meta.zone === "learn" ? `/learn/${lang ?? "english"}/${nextGame.slug}` : `/${meta.zone}/${nextGame.slug}`;

  const stars = outcome
    ? outcome.maxScore > 0
      ? Math.max(1, Math.round((outcome.score / outcome.maxScore) * 3))
      : 1
    : 0;
  const xpShown = useCountUp(outcome?.xp ?? 0, 700, !!outcome);

  return (
    <div className="container-page page-pad min-h-[100dvh] pb-24 pt-6 md:pb-10">
      {/* quiet top bar */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href={back}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft size={18} strokeWidth={2.4} /> Back
        </Link>
        <div className="flex items-center gap-2">
          {meta.zone === "learn" && <HeartsBar />}
          <Chip tone={streak > 0 ? "accent" : "neutral"}>
            <Flame size={13} strokeWidth={2.4} /> <span className="tnum">{streak}</span>
          </Chip>
          <Chip>
            <Sparkles size={13} strokeWidth={2.4} /> <span className="tnum">{fmt(coins)}</span>
          </Chip>
        </div>
      </div>

      {phase.current === "intro" && (
        <Card className="mx-auto max-w-xl p-6 text-start sm:p-8">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint">
            <ZoneArt zone={meta.zone} className="h-8 w-8" />
          </span>
          <h1 className="font-display text-2xl font-black text-fg sm:text-3xl">{meta.title}</h1>
          <p className="mt-2 text-base leading-relaxed text-muted">{meta.desc}</p>

          <ol className="mt-6 space-y-2">
            {meta.howTo.map((h, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-fg">
                <span className="font-display text-sm font-extrabold text-brand-ink">{i + 1}.</span>
                {h}
              </li>
            ))}
          </ol>

          {best > 0 && (
            <p className="mt-5 text-sm text-muted">
              Aapka best score:{" "}
              <span className="font-bold text-fg tnum">{fmt(best)}</span>
            </p>
          )}

          <Button size="lg" block className="mt-6" onClick={start}>
            {t("cta.start")}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            Sab kuch free hai — koi daily limit nahi, koi level lock nahi.
          </p>
        </Card>
      )}

      {phase.current === "playing" && <Game lang={lang} onEnd={handleEnd} />}

      {phase.current === "over" && outcome && !premium && (
        <AdSlot
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAMEOVER || undefined}
          className="mx-auto mb-4 max-w-xl"
          label="Advertisement"
        />
      )}

      {phase.current === "over" && outcome && (
        <Card className="mx-auto max-w-xl p-6 sm:p-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{meta.title}</p>
            <h2 className="mt-1 font-display text-2xl font-black text-fg sm:text-3xl">
              {outcome.perfect ? "Perfect score!" : "Game over!"}
            </h2>
            <div className="mt-3">
              <Stars value={stars} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
              <div className="font-display text-2xl font-black text-fg tnum">{fmt(outcome.score)}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted">Score</div>
            </div>
            <div className="rounded-xl border border-line bg-brand-tint p-3 text-center">
              <div className="font-display text-2xl font-black text-brand-ink tnum">+{fmt(xpShown)}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted">XP</div>
            </div>
            <div id="game-over-coins" className="rounded-xl border border-line bg-accent-tint p-3 text-center">
              <div className="font-display text-2xl font-black text-accent-ink tnum">+{fmt(outcome.coins)}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted">Coins</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>
                Level {lv.level} · {levelTitle(lv.level)}
              </span>
              <span className="tnum">
                {fmt(lv.into)}/{fmt(lv.need)} XP
              </span>
            </div>
            <Progress value={lv.progress * 100} label={`Level ${lv.level} progress`} />
          </div>

          {outcome.newBadges.length > 0 && (
            <div className="mt-5 rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-sm font-bold text-fg">Naye badges unlock hue!</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {outcome.newBadges.map((b) => (
                  <Chip key={b.id} tone="brand">
                    {b.emoji} {b.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <ShareRow title={meta.title} scoreText={scoreText} />
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button size="lg" onClick={start}>
              <RotateCcw size={18} strokeWidth={2.3} /> {t("cta.playAgain")}
            </Button>
            <Link href={nextHref} className="btn btn-secondary btn-lg">
              Next game: {nextGame.title}
            </Link>
          </div>
          <Link
            href={back}
            className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-muted hover:text-fg"
          >
            Zone wapas jao
          </Link>

          {/* soft, once-per-session, dismissible — never blocks anything */}
          <GameOverPremiumNote />
        </Card>
      )}

    </div>
  );
}

/** Tiny phase machine kept outside React state so games can remount cleanly. */
export class PhaseMachine {
  current: "intro" | "playing" | "over" = "intro";
  set(p: "intro" | "playing" | "over") {
    this.current = p;
  }
  dispose() {
    this.current = "intro";
  }
}

export function estimateXp(result: GameResult) {
  return xpForGame(result);
}
