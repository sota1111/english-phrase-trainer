/**
 * Shared, framework-free phrase helpers: the `QuizPhrase` shape used across the
 * learning features and a `shuffle` utility. Kept dependency-free so the logic is
 * easy to reason about and reuse (e.g. by the English-writing feature).
 */

export type QuizPhrase = {
  id: string;
  phrase: string;
  meaningJa: string;
  example: string;
  exampleJa: string;
};

/** Fisher–Yates shuffle returning a new array (does not mutate the input). */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
