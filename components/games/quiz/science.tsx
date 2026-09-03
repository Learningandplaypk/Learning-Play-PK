"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { SCIENCE } from "@/data/quiz/science";

export default function ScienceQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={SCIENCE} zoneLabel="Science" onEnd={onEnd} />;
}
