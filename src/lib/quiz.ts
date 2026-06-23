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
 * Turn a phrase into a fill-in-the-blank question.
 *
 * Preferred form: mask the phrase occurrence inside its example sentence
 * (case-insensitive). When the phrase has no usable example (the `example`
 * field is optional, so many phrases lack one — or the example does not contain
 * the phrase), fall back to a meaning-prompt blank: a bare blank whose answer is
 * the phrase itself. The quiz UI renders `meaningJa` as the hint, so this reads
 * as "type the English phrase for this Japanese meaning".
 *
 * Returns null only when the phrase has no answer text or no Japanese meaning to
 * prompt with — otherwise every phrase is blankable, so the fill-in-the-blank
 * quiz mode stays selectable whenever at least one phrase exists.
 */
export function buildBlank(
  phrase: QuizPhrase
): { sentence: string; answer: string; exampleJa: string } | null {
  const target = phrase.phrase?.trim();
  const meaning = phrase.meaningJa?.trim();
  if (!target || !meaning) return null;
  const example = phrase.example?.trim();
  if (example) {
    const idx = example.toLowerCase().indexOf(target.toLowerCase());
    if (idx !== -1) {
      const sentence = example.slice(0, idx) + BLANK + example.slice(idx + target.length);
      return { sentence, answer: target, exampleJa: phrase.exampleJa?.trim() ?? '' };
    }
  }
  // Fallback when there is no example sentence containing the phrase.
  return { sentence: BLANK, answer: target, exampleJa: '' };
}

/**
 * Phrases eligible for a fill-in-the-blank question. With the meaning-prompt
 * fallback in `buildBlank`, this is every phrase that has both a phrase and a
 * Japanese meaning.
 */
export function blankablePhrases(pool: QuizPhrase[]): QuizPhrase[] {
  return pool.filter((p) => buildBlank(p) !== null);
}
