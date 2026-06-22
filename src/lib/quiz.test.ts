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

  it('returns null when the example does not contain the phrase', () => {
    expect(buildBlank(p('1', 'kick off', 'A different sentence.'))).toBeNull();
  });

  it('returns null when there is no example', () => {
    expect(buildBlank(p('1', 'kick off', ''))).toBeNull();
  });
});

describe('blankablePhrases', () => {
  it('keeps only phrases whose example contains the phrase', () => {
    const pool = [
      p('1', 'apple', 'I ate an apple.'),
      p('2', 'banana', 'No fruit here.'),
      p('3', 'cherry', ''),
    ];
    expect(blankablePhrases(pool).map((x) => x.id)).toEqual(['1']);
  });
});
