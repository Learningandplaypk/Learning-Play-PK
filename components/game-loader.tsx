"use client";

import React from "react";
import { GameShell, type GameMeta, type GameProps } from "./game-shell";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { getGameData, type ZoneKey } from "@/lib/games-data";

const d = (loader: () => Promise<{ default: ComponentType<GameProps> }>) => dynamic(loader, { ssr: false });

const LEARN_LOADERS: Record<string, ComponentType<GameProps>> = {
  "word-builder": d(() => import("@/components/games/learn/word-builder")),
  "grammar-quest": d(() => import("@/components/games/learn/grammar-quest")),
  "vocab-battle": d(() => import("@/components/games/learn/vocab-battle")),
  "sentence-puzzle": d(() => import("@/components/games/learn/sentence-puzzle")),
  "listening-challenge": d(() => import("@/components/games/learn/listening-challenge")),
  "idiom-master": d(() => import("@/components/games/learn/idiom-master")),
  "story-builder": d(() => import("@/components/games/learn/story-builder")),
  pronunciation: d(() => import("@/components/games/learn/pronunciation")),
};

const BRAIN_LOADERS: Record<string, ComponentType<GameProps>> = {
  memory: d(() => import("@/components/games/brain/memory")),
  "math-speed": d(() => import("@/components/games/brain/math-speed")),
  reaction: d(() => import("@/components/games/brain/reaction")),
  stroop: d(() => import("@/components/games/brain/stroop")),
  sequence: d(() => import("@/components/games/brain/sequence")),
  g2048: d(() => import("@/components/games/brain/g2048")),
  sudoku: d(() => import("@/components/games/brain/sudoku")),
  chess: d(() => import("@/components/games/brain/chess")),
  pattern: d(() => import("@/components/games/brain/pattern")),
  logic: d(() => import("@/components/games/brain/logic")),
};

const QUIZ_LOADERS: Record<string, ComponentType<GameProps>> = {
  gk: d(() => import("@/components/games/quiz/gk")),
  pakistan: d(() => import("@/components/games/quiz/pakistan")),
  science: d(() => import("@/components/games/quiz/science")),
  islamic: d(() => import("@/components/games/quiz/islamic")),
  history: d(() => import("@/components/games/quiz/history")),
  geography: d(() => import("@/components/games/quiz/geography")),
  sports: d(() => import("@/components/games/quiz/sports")),
  tech: d(() => import("@/components/games/quiz/tech")),
  movies: d(() => import("@/components/games/quiz/movies")),
  millionaire: d(() => import("@/components/games/quiz/millionaire")),
};

const FUN_LOADERS: Record<string, ComponentType<GameProps>> = {
  snake3d: d(() => import("@/components/games/fun/snake3d")),
  tetris: d(() => import("@/components/games/fun/tetris")),
  flappy: d(() => import("@/components/games/fun/flappy")),
  tictactoe: d(() => import("@/components/games/fun/tictactoe")),
  connect4: d(() => import("@/components/games/fun/connect4")),
  hangman: d(() => import("@/components/games/fun/hangman")),
  wordsearch: d(() => import("@/components/games/fun/wordsearch")),
  minesweeper: d(() => import("@/components/games/fun/minesweeper")),
  typing: d(() => import("@/components/games/fun/typing")),
  bubble: d(() => import("@/components/games/fun/bubble")),
  fruitninja: d(() => import("@/components/games/fun/fruitninja")),
  jumble: d(() => import("@/components/games/fun/jumble")),
  racing: d(() => import("@/components/games/fun/racing")),
  crossword: d(() => import("@/components/games/fun/crossword")),
  g2048: d(() => import("@/components/games/brain/g2048")),
};

const LOADERS: Record<ZoneKey, Record<string, ComponentType<GameProps>>> = {
  learn: LEARN_LOADERS,
  brain: BRAIN_LOADERS,
  quiz: QUIZ_LOADERS,
  fun: FUN_LOADERS,
};

export function GameLoader({ zone, slug, lang }: { zone: ZoneKey; slug: string; lang?: string }) {
  const data = getGameData(slug);
  if (!data) return <p className="p-10 text-center text-muted">Game nahi mila.</p>;
  const load = LOADERS[zone][slug];
  if (!load) return <p className="p-10 text-center text-muted">Yeh game is zone mein available nahi.</p>;
  const meta: GameMeta = { ...data, load };
  return <GameShell meta={meta} lang={lang} backHref={zone === "learn" ? `/learn/${lang ?? "english"}` : `/${zone}`} />;
}
