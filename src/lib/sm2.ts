export interface SM2Params {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result extends SM2Params {
  dueDate: Date;
}

export function calculateNextReview(params: SM2Params, isCorrect: boolean): SM2Result {
  let { easeFactor, interval, repetitions } = params;
  if (isCorrect) {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1);
  } else {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  return { easeFactor, interval, repetitions, dueDate };
}

export const DEFAULT_SM2_PARAMS: SM2Params = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

/**
 * Orders review items by SRS urgency: items with an earlier (more overdue) due time
 * come first. Items whose due time is `null` (never scheduled) are placed last,
 * preserving their original relative order. The input array is not mutated.
 *
 * Decoupled from Firestore types via the `getDueMillis` accessor.
 */
export function orderByReviewUrgency<T>(
  items: T[],
  getDueMillis: (item: T) => number | null,
): T[] {
  return items
    .map((item, index) => ({ item, index, due: getDueMillis(item) }))
    .sort((a, b) => {
      if (a.due === null && b.due === null) return a.index - b.index;
      if (a.due === null) return 1;
      if (b.due === null) return -1;
      if (a.due !== b.due) return a.due - b.due;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

/**
 * Fisher-Yates shuffle. Non-mutating; returns a shuffled copy of the input.
 * Accepts an injectable RNG for deterministic tests.
 */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
