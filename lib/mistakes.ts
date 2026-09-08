/**
 * Mistakes Review — a personal practice set built from wrong answers.
 *
 * Free users still see their mistakes listed (honesty: we don't hide your own
 * data from you). The one-tap *practice drill* built from them is a premium
 * comfort feature, exactly like the progress report.
 */

export type Mistake = {
  /** Stable id: `${topic}:${prompt}` */
  id: string;
  /** e.g. "english", "quiz-gk", "vocab-battle" */
  topic: string;
  prompt: string;
  correct: string;
  /** What the learner answered (may be empty for timeouts). */
  given: string;
  /** Times they got this wrong. */
  misses: number;
  /** Times they got it right since — 2 clears it from the set. */
  hits: number;
  at: number;
};

export const CLEAR_AFTER_HITS = 2;
export const MAX_MISTAKES = 300;

export function mistakeId(topic: string, prompt: string): string {
  return `${topic}:${prompt}`.slice(0, 200);
}

export function recordMistake(
  list: Mistake[],
  m: { topic: string; prompt: string; correct: string; given?: string },
  now = Date.now()
): Mistake[] {
  const id = mistakeId(m.topic, m.prompt);
  const existing = list.find((x) => x.id === id);
  if (existing) {
    return [
      { ...existing, misses: existing.misses + 1, hits: 0, given: m.given ?? existing.given, at: now },
      ...list.filter((x) => x.id !== id),
    ].slice(0, MAX_MISTAKES);
  }
  return [
    { id, topic: m.topic, prompt: m.prompt, correct: m.correct, given: m.given ?? "", misses: 1, hits: 0, at: now },
    ...list,
  ].slice(0, MAX_MISTAKES);
}

/** Correct answer during review — two clean hits retire the item. */
export function recordReviewHit(list: Mistake[], id: string): Mistake[] {
  return list
    .map((m) => (m.id === id ? { ...m, hits: m.hits + 1 } : m))
    .filter((m) => m.hits < CLEAR_AFTER_HITS);
}

/** Practice set: worst-first (most misses, then most recent). */
export function buildPracticeSet(list: Mistake[], size = 10): Mistake[] {
  return [...list].sort((a, b) => b.misses - a.misses || b.at - a.at).slice(0, size);
}

export function mistakesByTopic(list: Mistake[]): Array<{ topic: string; count: number }> {
  const m = new Map<string, number>();
  list.forEach((x) => m.set(x.topic, (m.get(x.topic) ?? 0) + 1));
  return Array.from(m, ([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
}

/** Weak words = mistakes from language topics, worst first. */
export function weakWords(list: Mistake[], limit = 12): Mistake[] {
  return buildPracticeSet(
    list.filter((m) => !m.topic.startsWith("quiz")),
    limit
  );
}
