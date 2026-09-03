"use client";

import React, { useMemo, useState } from "react";
import type { GameProps } from "@/components/game-shell";
import { STORIES } from "@/data/english/stories";
import { shuffle } from "@/lib/utils";
import { sfx } from "@/lib/sfx";

/** Story Builder — complete 2 short stories per round by filling the blanks. */
export default function StoryBuilder({ onEnd }: GameProps) {
  const stories = useMemo(() => shuffle(STORIES).slice(0, 2), []);
  const [storyIdx, setStoryIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(stories[0].blanks.length).fill(-1));
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const story = stories[storyIdx];

  const allAnswered = answers.every((a) => a >= 0);

  const finish = (finalCorrect: number) => {
    onEnd({ score: finalCorrect * 8, maxScore: stories.reduce((n, s) => n + s.blanks.length, 0) * 8, accuracy: finalCorrect / stories.reduce((n, s) => n + s.blanks.length, 0), timeMs: Date.now() - startedAt });
  };

  const check = () => {
    const good = answers.filter((a, i) => a === story.blanks[i].a).length;
    sfx(good === story.blanks.length ? "win" : good >= story.blanks.length / 2 ? "correct" : "wrong");
    setChecked(true);
    setCorrect((c) => c + good);
  };

  const next = () => {
    if (storyIdx + 1 >= stories.length) {
      finish(correct);
    } else {
      const nsi = storyIdx + 1;
      setStoryIdx(nsi);
      setAnswers(Array(stories[nsi].blanks.length).fill(-1));
      setChecked(false);
    }
  };

  const renderText = () => {
    const parts = story.text.split(/___\s*\(\d+\)/);
    return (
      <p className="text-[15px] leading-loose">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span>{part}</span>
            {i < story.blanks.length && (
              <span
                className={`mx-1 inline-block min-w-20 rounded-lg px-2 py-0.5 text-center font-bold ${
                  !checked
                    ? answers[i] >= 0
                      ? "bg-electric/25 text-ink"
                      : "bg-white/8 text-muted"
                    : answers[i] === story.blanks[i].a
                      ? "bg-neon-green/25 text-neon-green"
                      : "bg-pink-accent/25 text-pink-accent"
                }`}
              >
                {answers[i] >= 0 ? story.blanks[i].options[answers[i]] : "___"}
              </span>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex justify-center gap-2 text-sm">
        <span className="chip">Story {storyIdx + 1}/{stories.length}</span>
        <span className="chip">✅ {correct} blanks</span>
      </div>
      <div className="glass p-6">
        <h3 className="font-display text-xl font-black">
          {story.emoji} <span className="text-gradient">{story.title}</span>
        </h3>
        <div className="mt-4">{renderText()}</div>

        {!checked ? (
          <div className="mt-6 space-y-3">
            {story.blanks.map((blank, bi) => (
              <div key={bi}>
                <p className="mb-1.5 text-xs font-bold text-muted">Blank {bi + 1}:</p>
                <div className="flex flex-wrap gap-2">
                  {blank.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => {
                        sfx("click");
                        setAnswers((a) => a.map((v, i) => (i === bi ? oi : v)));
                      }}
                      className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                        answers[bi] === oi ? "bg-electric/35 text-white ring-1 ring-electric" : "glass glass-hover text-ink"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn btn-neon mt-2 w-full" disabled={!allAnswered} onClick={check}>
              ✔ Story mukammal karo
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <p className="font-display text-lg font-bold text-neon-green">
              {answers.filter((a, i) => a === story.blanks[i].a).length}/{story.blanks.length} sahi!
            </p>
            {answers.some((a, i) => a !== story.blanks[i].a) && (
              <p className="mt-2 text-sm text-muted">
                Sahi jawabat:{" "}
                {story.blanks.map((b, i) => (
                  <span key={i} className="mx-1 font-bold text-ink">
                    {b.options[b.a]}
                  </span>
                ))}
              </p>
            )}
            <button className="btn btn-neon mt-4" onClick={next}>
              {storyIdx + 1 >= stories.length ? "🏁 Result dekho" : "Agli story →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
