/**
 * Pure helpers for the diversified quiz modes (提案5 / SOT-1048):
 * multiple-choice option building and fill-in-the-blank sentence construction.
 * Kept framework-free so the logic is easy to reason about and test.
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

/**
 * Build up to `count` multiple-choice options for `correct`: the correct English
 * phrase plus distractors drawn from other phrases. Falls back gracefully when
 * there are not enough distinct phrases (returns fewer options, never throws).
 */
export function buildMultipleChoice(
  correct: QuizPhrase,
  pool: QuizPhrase[],
  count = 4,
  rng: () => number = Math.random
): string[] {
  const seen = new Set<string>([correct.phrase.trim().toLowerCase()]);
  const distractors: string[] = [];
  for (const p of shuffle(pool, rng)) {
    if (distractors.length >= count - 1) break;
    const value = p.phrase.trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    distractors.push(value);
  }
  return shuffle([correct.phrase.trim(), ...distractors], rng);
}

const BLANK = '______';

/**
 * Turn a phrase's example into a fill-in-the-blank question by masking the
 * phrase occurrence (case-insensitive). Returns null when the example does not
 * contain the phrase, so callers can skip phrases that cannot form a blank.
 */
export function buildBlank(
  phrase: QuizPhrase
): { sentence: string; answer: string; exampleJa: string } | null {
  const example = phrase.example?.trim();
  const target = phrase.phrase?.trim();
  if (!example || !target) return null;
  const idx = example.toLowerCase().indexOf(target.toLowerCase());
  if (idx === -1) return null;
  const sentence = example.slice(0, idx) + BLANK + example.slice(idx + target.length);
  return { sentence, answer: target, exampleJa: phrase.exampleJa?.trim() ?? '' };
}

/** Phrases eligible for a fill-in-the-blank question (their example contains the phrase). */
export function blankablePhrases(pool: QuizPhrase[]): QuizPhrase[] {
  return pool.filter((p) => buildBlank(p) !== null);
}
