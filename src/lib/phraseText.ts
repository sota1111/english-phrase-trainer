/**
 * Helpers for keeping phrase text English-only (SOT-865).
 *
 * Some seeded phrases historically carried Japanese annotations in the `phrase`
 * field — `(優先暗記)` (priority memorization), `(セット表現)` (set phrase) and
 * `(重要動詞)` (important verb) — using both half-width `()` and full-width `（）`
 * parentheses. These annotations belong in the `memo` field, not the English
 * phrase. The helpers below detect and strip them.
 */

/** Japanese annotation tokens that must not appear inside an English phrase. */
const ANNOTATION_TOKENS = ['優先暗記', 'セット表現', '重要動詞'];

/**
 * Matches an annotation like ` (優先暗記)` / `（セット表現）`, including any
 * surrounding whitespace, with half- or full-width parentheses. Global so
 * `replace` removes every occurrence.
 */
const ANNOTATION_PATTERN = new RegExp(
  `\\s*[（(](?:${ANNOTATION_TOKENS.join('|')})[）)]\\s*`,
  'g',
);

/** True when the phrase text carries a Japanese annotation token. */
export function hasPhraseAnnotation(phrase: string): boolean {
  ANNOTATION_PATTERN.lastIndex = 0;
  return ANNOTATION_PATTERN.test(phrase);
}

/**
 * Remove every Japanese annotation from a phrase and normalize whitespace.
 * Idempotent: a phrase with no annotation is returned unchanged (aside from
 * trimming). `stripPhraseAnnotation('as a result (優先暗記)') === 'as a result'`.
 */
export function stripPhraseAnnotation(phrase: string): string {
  ANNOTATION_PATTERN.lastIndex = 0;
  return phrase.replace(ANNOTATION_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}
