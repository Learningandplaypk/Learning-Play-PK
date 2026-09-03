"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { GK } from "@/data/quiz/gk";

export default function GkQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={GK} zoneLabel="General Knowledge" onEnd={onEnd} />;
}
