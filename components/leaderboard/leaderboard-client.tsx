"use client";

import React, { useEffect, useMemo, useState } from "react";
import { TiltCard } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { fetchGlobalLeaderboard, type LeaderRow } from "@/lib/sync";
import { fmt } from "@/lib/utils";

type Tab = "global" | "weekly";

export function LeaderboardClient() {
  const [tab, setTab] = useState<Tab>("global");
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const localResults = usePlayer((s) => s.results);
  const myName = usePlayer((s) => s.name);
  const myXp = usePlayer((s) => s.xp);
  const myAvatar = usePlayer((s) => s.avatar);
  const myUid = usePlayer((s) => s.uid);

  useEffect(() => {
    let alive = true;
    setRows(null);
    fetchGlobalLeaderboard()
      .catch(() => null)
      .then((r) => {
        if (alive) setRows(r);
      });
    return () => {
      alive = false;
    };
  }, [tab]);

  const localBoard = useMemo(() => {
    // local aggregate: best score per game + xp
    const best = new Map<string, number>();
    localResults.forEach((r) => best.set(r.slug, Math.max(best.get(r.slug) ?? 0, r.score)));
    const rows = Array.from(best.entries())
      .map(([slug, score]) => ({ uid: myUid ?? "me", name: slug, avatar: "🎯", score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
    return rows;
  }, [localResults, myUid]);

  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-3xl pb-28 pt-28">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-black sm:text-5xl">
          <span className="text-gradient">🏆 Leaderboard</span>
        </h1>
        <p className="mt-2 text-sm text-muted">XP kamao, games khelo — Pakistan bhar mein apni jagah banao.</p>
      </div>

      <div className="mb-5 flex justify-center gap-2">
        {(["global", "weekly"] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`chip cursor-pointer ${tab === tb ? "border-neon-green/60 text-neon-green" : ""}`} aria-pressed={tab === tb}>
            {tb === "global" ? "🌍 Global XP" : "📅 Is Haftay"}
          </button>
        ))}
      </div>

      {/* your position */}
      <TiltCard className="mb-6 flex items-center gap-4 p-5" intensity={5}>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-neon-green/40 to-electric/40 text-2xl">{myAvatar}</span>
        <div className="flex-1">
          <p className="font-display font-bold">{myName || "Tum"} <span className="ml-1 text-[10px] uppercase tracking-widest text-neon-green">aap</span></p>
          <p className="text-xs text-muted">{fmt(myXp)} total XP • {localResults.length} games khelay</p>
        </div>
        <span className="font-display text-2xl font-black text-neon-green">
          {rows ? (rows.findIndex((r) => r.uid === myUid) >= 0 ? `#${rows.findIndex((r) => r.uid === myUid) + 1}` : "—") : "—"}
        </span>
      </TiltCard>

      {rows === null ? (
        <>
          <p className="mb-3 text-xs text-muted">
            {tab === "global"
              ? "☁️ Cloud leaderboard sirf Firebase configure hone ke baad live hota hai — tab tak yeh rahanuma:"
              : "📅 Weekly rankings cloud se aati hain — Firebase setup ke baad live."}
          </p>
          <TiltCard className="p-5">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted">Aapke local bests (per game)</h3>
            {localBoard.length === 0 ? (
              <p className="text-sm text-muted">Abhi koi score nahi — pehla game khelo!</p>
            ) : (
              <ol className="space-y-2">
                {localBoard.map((r, i) => (
                  <li key={r.name} className="glass flex items-center gap-3 px-3 py-2">
                    <span className="w-6 text-center font-display font-black text-muted">{i + 1}</span>
                    <span className="text-lg">{r.avatar}</span>
                    <span className="flex-1 text-sm font-semibold">{r.name}</span>
                    <span className="text-xs font-bold text-neon-green">{fmt(r.score)}</span>
                  </li>
                ))}
              </ol>
            )}
          </TiltCard>
        </>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm text-muted">Is hafte koi score nahi — pehla ho tum! 🚀</p>
      ) : (
        <TiltCard className="p-5">
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.uid} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${r.uid === myUid ? "border border-neon-green/40 bg-neon-green/10" : "bg-white/5"}`}>
                <span className="w-7 text-center font-display font-black text-muted">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
                <span className="text-xl">{r.avatar}</span>
                <span className="flex-1 text-sm font-semibold">{r.name}</span>
                <span className="text-xs font-bold text-neon-green">{fmt(r.score)}</span>
              </li>
            ))}
          </ol>
        </TiltCard>
      )}
    </div>
  );
}
