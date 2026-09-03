"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { MOVIES } from "@/data/quiz/movies";

export default function MoviesQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={MOVIES} zoneLabel="Lollywood/Bollywood" onEnd={onEnd} />;
}
