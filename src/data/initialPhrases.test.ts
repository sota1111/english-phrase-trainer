import { describe, it, expect } from 'vitest';
import { initialPhrases } from './initialPhrases';
import { phraseInputSchema } from '@/lib/validation/schemas';

describe('initialPhrases dataset', () => {
  it('has at least 50 entries', () => {
    expect(initialPhrases.length).toBeGreaterThanOrEqual(50);
  });

  it('every entry satisfies phraseInputSchema', () => {
    for (const entry of initialPhrases) {
      expect(() => phraseInputSchema.parse(entry)).not.toThrow();
    }
  });

  it('has unique phrase texts (seed is idempotent by phrase)', () => {
    const texts = initialPhrases.map((p) => p.phrase);
    const unique = new Set(texts);
    expect(unique.size).toBe(texts.length);
  });

  it('only uses known categories', () => {
    const allowed = new Set(['word', 'expression', 'pattern']);
    for (const entry of initialPhrases) {
      expect(allowed.has(entry.category)).toBe(true);
    }
  });

  it('every word entry is categorized as word', () => {
    const words = initialPhrases.filter((p) => p.category === 'word');
    expect(words.length).toBe(23);
  });

  it('marks the 10 priority items as hard', () => {
    const hard = initialPhrases.filter((p) => p.difficulty === 'hard');
    expect(hard.length).toBe(10);
  });

  it('every phrase and meaningJa is non-empty', () => {
    for (const entry of initialPhrases) {
      expect(entry.phrase.trim().length).toBeGreaterThan(0);
      expect(entry.meaningJa.trim().length).toBeGreaterThan(0);
    }
  });
});
