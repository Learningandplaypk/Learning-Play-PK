"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { GEOGRAPHY } from "@/data/quiz/geography";

export default function GeographyQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={GEOGRAPHY} zoneLabel="Geography" onEnd={onEnd} />;
}
