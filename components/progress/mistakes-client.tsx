"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, X } from "lucide-react";
import { Button, Card, Chip, EmptyState } from "@/components/ui";
import { usePlayer } from "@/lib/store";
import { buildPracticeSet, mistakesByTopic } from "@/lib/mistakes";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

/**
 * Mistakes Review — one tap turns your wrong answers into a practice drill.
 * Free users can see the list (it is their own data); the drill is premium.
 */
export function MistakesClient() {
  const mistakes = usePlayer((s) => s.mistakes);
  const clearMistake = usePlayer((s) => s.clearMistake);
  const premium = usePlayer((s) => s.premium);
  const toast = usePlayer((s) => s.toast);

  const [drill, setDrill] = useState<ReturnType<typeof buildPracticeSet> | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const byTopic = useMemo(() => mistakesByTopic(mistakes), [mistakes]);
  const current = drill?.[i];

  const options = useMemo(() => {
    if (!current) return [];
    const distractors = mistakes
      .filter((m) => m.id !== current.id && m.correct !== current.correct)
      .slice(0, 3)
      .map((m) => m.correct);
    return shuffle([current.correct, ...distractors]);
  }, [current, mistakes]);

  const start = () => {
    setDrill(buildPracticeSet(mistakes, 10));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  const answer = (choice: string) => {
    if (!current || picked) return;
    setPicked(choice);
    const right = choice === current.correct;
    sfx(right ? "correct" : "wrong");
    if (right) {
      setScore((n) => n + 1);
      clearMistake(current.id);
    }
    setTimeout(() => {
      setPicked(null);
      if (drill && i + 1 < drill.length) setI(i + 1);
      else {
        setDrill(null);
        toast("🧠", "Review mukammal!", `${right ? score + 1 : score}/${drill?.length ?? 0} sahi`);
      }
    }, 900);
  };

  if (mistakes.length === 0) {
    return (
      <div className="container-page page-pad pb-24 pt-8">
        <EmptyState
          title="Koi ghalti record nahi"
          body="Jab kisi lesson ya quiz mein jawab ghalat hoga, woh yahan aa jayega — phir ek tap mein practice."
          action={
            <Link href="/learn" className="btn btn-primary">
              Lesson khelo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page page-pad pb-24 pt-8 md:pb-10">
      <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Mistakes review</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Aap ke ghalat jawabon se bana hua personal practice set. Har lafz do martaba sahi hone par list se nikal jata
        hai.
      </p>

      {/* drill */}
      {drill && current ? (
        <Card className="mx-auto mt-6 max-w-lg p-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              {i + 1} / {drill.length}
            </span>
            <span className="tnum">{score} sahi</span>
          </div>
          <p className="mt-4 font-display text-2xl font-black text-fg">{current.prompt}</p>
          <p className="mt-1 text-xs text-muted">{current.topic}</p>
          <div className="mt-5 grid gap-2">
            {options.map((o) => {
              const isRight = o === current.correct;
              const show = picked !== null;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => answer(o)}
                  disabled={show}
                  className={`min-h-12 rounded-xl border px-4 text-start text-sm font-semibold transition-colors ${
                    show && isRight
                      ? "border-success bg-success-tint text-success-ink"
                      : show && picked === o
                        ? "border-danger bg-danger-tint text-danger-ink"
                        : "border-line bg-surface text-fg hover:bg-surface-2"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {show && isRight && <Check size={15} strokeWidth={3} />}
                    {show && picked === o && !isRight && <X size={15} strokeWidth={3} />}
                    {o}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-base font-extrabold text-fg">{mistakes.length} items practice ke liye</p>
              <p className="mt-1 text-xs text-muted">
                {premium
                  ? "Ek tap — 10 sawal ka quick drill."
                  : "Drill Premium feature hai. List phir bhi aap ki hai aur khuli hai."}
              </p>
            </div>
            {premium ? (
              <Button onClick={start}>
                <RotateCcw size={16} strokeWidth={2.3} /> Practice shuru karo
              </Button>
            ) : (
              <Link href="/premium" className="btn btn-primary btn-sm">
                Premium dekho
              </Link>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {byTopic.map((t) => (
              <Chip key={t.topic}>
                {t.topic} · {t.count}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {/* full list */}
      <Card className="mt-5 p-5">
        <h2 className="font-display text-base font-extrabold text-fg">Poori list</h2>
        <ul className="mt-3 grid gap-2">
          {mistakes.slice(0, 60).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-fg">{m.prompt}</span>
                <span className="block truncate text-xs text-muted">
                  Sahi: {m.correct}
                  {m.given ? ` · Aap ne likha: ${m.given}` : ""}
                </span>
              </span>
              <Chip>{m.misses}×</Chip>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
