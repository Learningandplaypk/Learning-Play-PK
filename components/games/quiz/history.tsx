"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { HISTORY } from "@/data/quiz/history";

export default function HistoryQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={HISTORY} zoneLabel="History" onEnd={onEnd} />;
}
