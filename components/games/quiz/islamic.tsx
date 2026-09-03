"use client";

import React from "react";
import QuizEngine from "./quiz-engine";
import type { GameProps } from "@/components/game-shell";
import { ISLAMIC } from "@/data/quiz/islamic";

export default function IslamicQuiz({ onEnd }: GameProps) {
  return <QuizEngine questions={ISLAMIC} zoneLabel="Islamic Studies" onEnd={onEnd} />;
}
