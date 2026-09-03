"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { SPORTS } from "@/data/quiz/sports";

export default function SportsQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={SPORTS} zoneLabel="Sports" onEnd={onEnd} />;
}
