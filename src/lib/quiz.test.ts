import { describe, it, expect } from 'vitest';
import { buildMultipleChoice, buildBlank, blankablePhrases, QuizPhrase } from '@/lib/quiz';

const p = (id: string, phrase: string, example = ''): QuizPhrase => ({
  id,
  phrase,
  meaningJa: `${phrase}-ja`,
  example,
  exampleJa: '',
});

// Deterministic RNG so option order is predictable in tests.
const fixedRng = () => 0;

describe('buildMultipleChoice', () => {
  it('always includes the correct answer', () => {
    const correct = p('1', 'apple');
    const pool = [correct, p('2', 'banana'), p('3', 'cherry'), p('4', 'date')];
    const options = buildMultipleChoice(correct, pool, 4, fixedRng);
    expect(options).toContain('apple');
  });

  it('returns up to `count` unique options', () => {
    const correct = p('1', 'apple');
    const pool = [correct, p('2', 'banana'), p('3', 'cherry'), p('4', 'date'), p('5', 'fig')];
    const options = buildMultipleChoice(correct, pool, 4, fixedRng);
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
  });

  it('does not throw or duplicate when there are not enough distractors', () => {
    const correct = p('1', 'apple');
    const options = buildMultipleChoice(correct, [correct], 4, fixedRng);
    expect(options).toEqual(['apple']);
  });

  it('excludes distractors equal to the correct answer (case-insensitive)', () => {
    const correct = p('1', 'Apple');
    const pool = [correct, p('2', 'apple'), p('3', 'banana')];
    const options = buildMultipleChoice(correct, pool, 4, fixedRng);
    expect(options.filter((o) => o.toLowerCase() === 'apple')).toHaveLength(1);
  });
});

describe('buildBlank', () => {
  it('masks the phrase occurrence in the example', () => {
    const result = buildBlank(p('1', 'kick off', 'They kick off the meeting.'));
    expect(result).not.toBeNull();
    expect(result!.answer).toBe('kick off');
    expect(result!.sentence).toContain('______');
    expect(result!.sentence.toLowerCase()).not.toContain('kick off');
  });

  it('falls back to a meaning-prompt blank when the example does not contain the phrase', () => {
    const result = buildBlank(p('1', 'kick off', 'A different sentence.'));
    expect(result).not.toBeNull();
    expect(result!.sentence).toBe('______');
    expect(result!.answer).toBe('kick off');
  });

  it('falls back to a meaning-prompt blank when there is no example', () => {
    const result = buildBlank(p('1', 'kick off', ''));
    expect(result).not.toBeNull();
    expect(result!.sentence).toBe('______');
    expect(result!.answer).toBe('kick off');
  });

  it('returns null when the phrase has no Japanese meaning', () => {
    const phrase: QuizPhrase = { id: '1', phrase: 'kick off', meaningJa: '', example: '', exampleJa: '' };
    expect(buildBlank(phrase)).toBeNull();
  });

  it('returns null when the phrase text is empty', () => {
    const phrase: QuizPhrase = { id: '1', phrase: '   ', meaningJa: 'なにか', example: '', exampleJa: '' };
    expect(buildBlank(phrase)).toBeNull();
  });
});

describe('blankablePhrases', () => {
  it('includes every phrase that has a phrase and a meaning (example optional)', () => {
    const pool = [
      p('1', 'apple', 'I ate an apple.'), // example-based blank
      p('2', 'banana', 'No fruit here.'), // example present but no match -> fallback
      p('3', 'cherry', ''), // no example -> fallback
    ];
    expect(blankablePhrases(pool).map((x) => x.id)).toEqual(['1', '2', '3']);
  });

  it('excludes phrases missing a meaning', () => {
    const pool = [
      p('1', 'apple', 'I ate an apple.'),
      { id: '2', phrase: 'banana', meaningJa: '', example: '', exampleJa: '' },
    ];
    expect(blankablePhrases(pool).map((x) => x.id)).toEqual(['1']);
  });
});
