/** Shared quiz question type used by the quiz engine, all topics and Millionaire. */
export type QuizQ = {
  q: string;
  o: string[];
  a: number; // index of correct option
  e?: string; // explanation
};
