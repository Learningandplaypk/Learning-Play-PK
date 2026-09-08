"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trophy, Users } from "lucide-react";
import { Card, EmptyState, Skeleton, Tabs } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { PremiumBadge } from "@/components/premium/premium-nudge";
import { fetchGlobalLeaderboard, type LeaderRow } from "@/lib/sync";
import { fmt } from "@/lib/utils";
import { Ustad } from "@/components/brand/ustad";

type Tab = "weekly" | "all" | "friends";

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd left-to-right

export function LeaderboardClient() {
  const [tab, setTab] = useState<Tab>("weekly");
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const localResults = usePlayer((s) => s.results);
  const myName = usePlayer((s) => s.name);
  const myPremium = usePlayer((s) => s.premium);
  const myXp = usePlayer((s) => s.xp);
  const myAvatar = usePlayer((s) => s.avatar);
  const myUid = usePlayer((s) => s.uid);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchGlobalLeaderboard()
      .catch(() => null)
      .then((r) => {
        if (!alive) return;
        setRows(r);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tab]);

  /** Local stand-in board so the page is never empty in guest mode. */
  const localBoard = useMemo(() => {
    const best = new Map<string, number>();
    localResults.forEach((r) => best.set(r.slug, Math.max(best.get(r.slug) ?? 0, r.score)));
    return Array.from(best.entries())
      .map(([slug, score]) => ({ uid: `local-${slug}`, name: slug.replace(/-/g, " "), avatar: "🎯", score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [localResults]);

  const board: LeaderRow[] = rows ?? localBoard;
  const mine: LeaderRow = { uid: myUid ?? "me", name: myName || "Tum", avatar: myAvatar, score: myXp };
  const myRank = rows ? rows.findIndex((r) => r.uid === myUid) : -1;
  const podium = board.slice(0, 3);
  const rest = board.slice(3);

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <div className="mb-6">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-accent-tint text-accent-ink">
          <Trophy size={26} strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Leaderboard</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          XP kamao, games khelo — Pakistan bhar mein apni jagah banao.
        </p>
      </div>

      <Tabs<Tab>
        className="mb-5"
        tabs={[
          { id: "weekly", label: "Is hafte" },
          { id: "all", label: "All-time" },
          { id: "friends", label: "Friends" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : tab === "friends" ? (
        <EmptyState
          title="Friends abhi taiyaar ho rahe hain"
          body="Jaldi hi doston ko challenge kar sako ge. Tab tak global board par jagah banao."
          icon={<Ustad mood="think" className="h-20 w-20" />}
          action={
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTab("weekly")}>
              Global board dekho
            </button>
          }
        />
      ) : board.length === 0 ? (
        <EmptyState
          title="Abhi koi score nahi"
          body="Pehla game khelo — pehli jagah tumhari ho sakti hai."
          icon={<Ustad mood="happy" className="h-20 w-20" />}
          action={
            <a href="/fun" className="btn btn-primary btn-sm">
              Pehla game khelo
            </a>
          }
        />
      ) : (
        <>
          {/* podium */}
          <div className="mb-4 grid grid-cols-3 items-end gap-2 sm:gap-3">
            {PODIUM_ORDER.map((idx) => {
              const p = podium[idx];
              if (!p) return <div key={idx} />;
              const place = idx + 1;
              const height = place === 1 ? "h-32" : place === 2 ? "h-24" : "h-20";
              return (
                <Card key={p.uid} className="flex flex-col items-center p-3 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-2xl">
                    {p.avatar}
                  </span>
                  <p className="mt-2 w-full truncate text-xs font-semibold text-fg">{p.name}</p>
                  <p className="font-display text-sm font-black text-brand-ink tnum">{fmt(p.score)}</p>
                  <div
                    className={`mt-2 flex w-full items-center justify-center rounded-t-lg font-display text-lg font-black text-white ${height}`}
                    style={{
                      background: place === 1 ? "var(--brand-solid)" : place === 2 ? "var(--brand)" : "var(--accent)",
                      color: place === 3 ? "#4a2f00" : "#fff",
                    }}
                  >
                    {place}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* list */}
          <Card className="divide-y divide-[var(--border)] p-0">
            {rest.map((r, i) => (
              <div key={r.uid} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-center font-display text-sm font-black text-muted tnum">{i + 4}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-lg">{r.avatar}</span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-semibold text-fg">
                  <span className="truncate">{r.name}</span>
                  {r.uid === myUid && myPremium && <PremiumBadge />}
                </span>
                <span className="font-display text-sm font-bold text-brand-ink tnum">{fmt(r.score)} XP</span>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* your position */}
      <Card className="mt-4 flex items-center gap-4 border-brand p-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-tint text-2xl">{myAvatar}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display text-sm font-extrabold text-fg">
            {myName || "Tum"}
            <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-ink">
              aap
            </span>
          </p>
          <p className="text-xs text-muted">
            <span className="tnum">{fmt(myXp)}</span> total XP · {localResults.length} games khele
          </p>
        </div>
        <span className="font-display text-2xl font-black text-brand-ink tnum">
          {myRank >= 0 ? `#${myRank + 1}` : "—"}
        </span>
      </Card>

      {!rows && (
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Users size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
          Cloud leaderboard Firebase configure hone ke baad live hota hai — tab tak aapke local bests dikh rahe hain.
        </p>
      )}
    </div>
  );
}
