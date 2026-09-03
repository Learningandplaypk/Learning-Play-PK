"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { PAKISTAN } from "@/data/quiz/pakistan";

export default function PakistanQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={PAKISTAN} zoneLabel="Pakistan Studies" onEnd={onEnd} />;
}
