"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Download, HardDrive, Trash2, WifiOff } from "lucide-react";
import { Button, Card, Chip } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { downloadPack, formatBytes, packStatuses, removePack, totalBytes, type PackStatus } from "@/lib/offline-packs";
import { getLangMeta } from "@/lib/lang-paths";
import { LangTile } from "@/components/brand/lang-tile";

/** Offline lesson packs + manage-storage UI (premium). */
export function DownloadsClient() {
  const premium = usePlayer((s) => s.premium);
  const toast = usePlayer((s) => s.toast);
  const [packs, setPacks] = useState<PackStatus[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // only the languages the learner actually uses get an offline pack slot
  const myLangs = usePlayer((s) => s.learningLanguages);

  const refresh = useCallback(async () => {
    setPacks(await packStatuses());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const download = async (lang: string, label: string) => {
    setBusy(lang);
    try {
      const n = await downloadPack(lang);
      toast("📥", `${label} download ho gaya`, `${n} pages offline available hain`);
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (lang: string, label: string) => {
    setBusy(lang);
    try {
      await removePack(lang);
      toast("🗑️", `${label} hata diya`, "Storage khali ho gayi");
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const used = packs ? totalBytes(packs) : 0;

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-brand-tint text-brand-ink">
        <WifiOff size={26} strokeWidth={2.2} />
      </span>
      <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Offline lesson packs</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Poori zubaan phone mein save karo aur bina internet parho — safar mein, ya jab data khatam ho jaye. Yeh Premium
        feature hai; baqi sab kuch online free hai.
      </p>

      {!premium && (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted">
            Offline packs Premium mein aate hain. Online lessons aap ke liye ab bhi poore khule hain.
          </p>
          <Link href="/premium" className="btn btn-primary btn-sm">
            Premium dekho
          </Link>
        </Card>
      )}

      <Card className="mt-5 flex flex-wrap items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-muted">
          <HardDrive size={18} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-sm font-bold text-fg">Storage istemal</p>
          <p className="text-xs text-muted tnum">{formatBytes(used)} — {packs?.filter((p) => p.cached > 0).length ?? 0} packs</p>
        </div>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(packs ?? [])
          .filter((p) => myLangs.includes(p.lang))
          .map((p) => {
          const done = p.cached > 0;
          const meta = getLangMeta(p.lang);
          if (!meta) return null;
          return (
            <Card key={p.lang} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                  {meta ? <LangTile meta={meta} size={30} /> : null}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-extrabold text-fg">{p.label}</p>
                  <p className="text-xs text-muted tnum">
                    {done ? `${p.cached}/${p.total} pages · ${formatBytes(p.bytes)}` : `${p.total} pages`}
                  </p>
                </div>
              </div>
              {done ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Chip tone="brand">
                    <Check size={12} strokeWidth={3} /> Saved
                  </Chip>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy !== null}
                    onClick={() => remove(p.lang, p.label)}
                    aria-label={`${p.label} hatao`}
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!premium || busy !== null}
                  onClick={() => download(p.lang, p.label)}
                >
                  {busy === p.lang ? "…" : <Download size={15} strokeWidth={2.2} />}
                </Button>
              )}
            </Card>
          );
          })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Packs aap ke browser ki cache mein rehte hain — hum kuch upload nahi karte. Browser data clear karne par woh bhi
        chale jayenge.
      </p>
    </div>
  );
}
