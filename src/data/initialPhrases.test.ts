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

  it('only uses the broad topical categories (ビジネス / 技術 / 日常)', () => {
    const allowed = new Set(['ビジネス', '技術', '日常']);
    for (const entry of initialPhrases) {
      expect(allowed.has(entry.category)).toBe(true);
    }
  });

  it('every phrase and meaningJa is non-empty', () => {
    for (const entry of initialPhrases) {
      expect(entry.phrase.trim().length).toBeGreaterThan(0);
      expect(entry.meaningJa.trim().length).toBeGreaterThan(0);
    }
  });

  it('classifies every entry with an explicit importance (SOT-890)', () => {
    for (const entry of initialPhrases) {
      expect(['high', 'normal', 'low']).toContain(entry.importance);
    }
  });
});
