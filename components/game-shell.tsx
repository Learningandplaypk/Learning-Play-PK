"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button, Modal, Progress, TiltCard } from "./ui";
import { usePlayer, type Zone } from "@/lib/store";
import { levelFromXp, levelTitle, xpForGame } from "@/lib/gamification";
import { pushProgressToFirestore } from "@/lib/sync";
import { sfx } from "@/lib/sfx";
import { fmt } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useI18n } from "@/lib/i18n";
import type { GameData } from "@/lib/games-data";

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
      <Button size="sm" variant="neon" onClick={native}>
        📤 Share Score
      </Button>
      <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text + url)}`}>
        💬 WhatsApp
      </a>
      <a
        className="btn btn-ghost btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
      >
        ✖️ Post
      </a>
      <a
        className="btn btn-ghost btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
      >
        📘 Facebook
      </a>
      <Button size="sm" variant="ghost" onClick={copy}>
        {copied ? "✅ Copied!" : "🔗 Copy Link"}
      </Button>
    </div>
  );
}

export function GameShell({ meta, lang, backHref }: { meta: GameMeta; lang?: string; backHref?: string }) {
  const { t } = useI18n();
  const phase = useMemo(() => new PhaseMachine(), []);
  const [, force] = useState(0);
  const [upsell, setUpsell] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [outcome, setOutcome] = useState<ReturnType<ReturnType<typeof usePlayer.getState>["submitGame"]> | null>(null);
  const submitGame = usePlayer((s) => s.submitGame);
  const canPlay = usePlayer((s) => s.canPlay);
  const xp = usePlayer((s) => s.xp);
  const best = usePlayer((s) => {
    const rows = s.results.filter((r) => r.slug === meta.slug);
    return rows.length ? Math.max(...rows.map((r) => r.score)) : 0;
  });

  useEffect(() => () => phase.dispose(), [phase]);

  const start = useCallback(() => {
    const check = canPlay(meta.zone);
    if (!check.ok) {
      setUpsell(true);
      return;
    }
    sfx("whoosh");
    phase.set("playing");
    force((n) => n + 1);
  }, [canPlay, meta.zone, phase]);

  const handleEnd = useCallback(
    (result: GameResult) => {
      const o = submitGame({ slug: meta.slug, zone: meta.zone, result, flag: result.flag, words: result.words, quizCorrect: result.quizCorrect });
      setOutcome(o);
      setLastResult(result);
      phase.set("over");
      force((n) => n + 1);
      void pushProgressToFirestore(o);
      const q = result.maxScore > 0 ? result.score / result.maxScore : 0;
      if (q >= 0.6) {
        sfx("win");
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: ["#39ff14", "#2d7cff", "#b026ff", "#ff2e97"] });
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

  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-4xl pb-28 pt-24 lg:pt-28">
      <div className="mb-5 flex items-center justify-between">
        <Link href={back} className="chip hover:text-ink">
          ← {backHref ? "Zone" : t("nav.home")}
        </Link>
        <div className="chip">
          🔥 {usePlayer.getState().streak} • 🪙 {fmt(usePlayer.getState().coins)}
        </div>
      </div>

      {phase.current === "intro" && (
        <TiltCard className="p-8 text-center" intensity={6}>
          <div className="mx-auto mb-5 grid h-28 w-28 animate-float place-items-center rounded-3xl bg-gradient-to-br from-electric/30 via-neon-purple/25 to-neon-green/25 text-6xl shadow-[0_0_60px_-12px_rgba(45,124,255,.7)]">
            {meta.emoji}
          </div>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            <span className="text-gradient">{meta.title}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted">{meta.desc}</p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-ink/85">
            {meta.howTo.map((h, i) => (
              <li key={i} className="glass flex items-start gap-3 px-4 py-2.5">
                <span className="font-display font-black text-neon-green">{i + 1}.</span> {h}
              </li>
            ))}
          </ul>
          {best > 0 && <p className="mt-5 text-sm text-muted">Aapka best score: <span className="font-bold text-neon-green">{fmt(best)}</span></p>}
          <Button className="mt-6" onClick={start}>
            🎮 {t("cta.start")}
          </Button>
          <p className="mt-3 text-[11px] text-muted">
            Free plan: roz 5 games + 3 lessons. <Link className="text-pink-accent underline underline-offset-2" href="/premium">Premium unlimited</Link>
          </p>
        </TiltCard>
      )}

      {phase.current === "playing" && <Game lang={lang} onEnd={handleEnd} />}

      {phase.current === "over" && outcome && (
        <TiltCard className="p-8 text-center" intensity={5}>
          <div className="text-5xl">{outcome.perfect ? "🏆" : outcome.score / Math.max(1, outcome.maxScore) >= 0.6 ? "🎉" : "💪"}</div>
          <h2 className="mt-3 font-display text-3xl font-black">
            <span className="text-gradient">{outcome.perfect ? "Perfect Score!" : "Game Over!"}</span>
          </h2>
          <p className="mt-1 text-muted">{meta.title}</p>

          <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3">
            <div className="glass p-3">
              <div className="font-display text-2xl font-black text-ink">{fmt(outcome.score)}</div>
              <div className="text-[11px] uppercase text-muted">Score</div>
            </div>
            <div className="glass p-3">
              <div className="font-display text-2xl font-black text-neon-green">+{fmt(outcome.xp)}</div>
              <div className="text-[11px] uppercase text-muted">XP</div>
            </div>
            <div className="glass p-3">
              <div className="font-display text-2xl font-black text-neon-orange">+{fmt(outcome.coins)}</div>
              <div className="text-[11px] uppercase text-muted">Coins</div>
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-sm">
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>Level {lv.level} • {levelTitle(lv.level)}</span>
              <span>{fmt(lv.into)}/{fmt(lv.need)} XP</span>
            </div>
            <Progress value={lv.progress * 100} />
          </div>

          {outcome.newBadges.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-neon-green">Naye badges unlock hue!</p>
              <div className="flex flex-wrap justify-center gap-2">
                {outcome.newBadges.map((b) => (
                  <span key={b.id} className="chip pop-in border-neon-green/40 text-ink">
                    {b.emoji} {b.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7">
            <ShareRow title={meta.title} scoreText={scoreText} />
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={start}>🔄 {t("cta.playAgain")}</Button>
            <Link href={back} className="btn btn-ghost">
              ← Zone wapas
            </Link>
          </div>
        </TiltCard>
      )}

      <Modal open={upsell} onClose={() => setUpsell(false)}>
        <div className="text-center">
          <div className="text-5xl">⏳</div>
          <h3 className="mt-3 font-display text-2xl font-black text-gradient">Aaj ka free limit khatam!</h3>
          <p className="mt-2 text-sm text-muted">
            Free plan mein roz 5 games + 3 lessons milte hain. Premium par <b className="text-ink">unlimited games, zero ads, progress reports aur certificate</b> milta hai — sirf Rs. 399/mahina.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/premium" className="btn btn-neon w-full">⚡ Premium Lo — Rs. 399/mo</Link>
            <Button variant="ghost" onClick={() => setUpsell(false)}>Baad mein</Button>
          </div>
        </div>
      </Modal>
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
