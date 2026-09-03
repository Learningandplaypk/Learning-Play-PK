"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { TECH } from "@/data/quiz/tech";

export default function TechQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={TECH} zoneLabel="Tech" onEnd={onEnd} />;
}
