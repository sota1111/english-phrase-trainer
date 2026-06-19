import { describe, it, expect } from 'vitest';
import { sot826Phrases } from './sot826Phrases';
import { phraseInputSchema } from '@/lib/validation/schemas';

// SOT-866: categories reorganized into three broad topical buckets.
const KNOWN_CATEGORIES = new Set(['ビジネス', '技術', '日常']);

describe('sot826Phrases dataset', () => {
  it('has at least 240 entries', () => {
    expect(sot826Phrases.length).toBeGreaterThanOrEqual(240);
  });

  it('every entry satisfies phraseInputSchema', () => {
    for (const entry of sot826Phrases) {
      expect(() => phraseInputSchema.parse(entry)).not.toThrow();
    }
  });

  it('every phrase and meaningJa is non-empty', () => {
    for (const entry of sot826Phrases) {
      expect(entry.phrase.trim().length).toBeGreaterThan(0);
      expect(entry.meaningJa.trim().length).toBeGreaterThan(0);
    }
  });

  it('has unique phrase texts (seed is idempotent by phrase)', () => {
    const texts = sot826Phrases.map((p) => p.phrase);
    const unique = new Set(texts);
    expect(unique.size).toBe(texts.length);
  });

  it('only uses the broad topical categories (ビジネス / 技術 / 日常)', () => {
    for (const entry of sot826Phrases) {
      expect(KNOWN_CATEGORIES.has(entry.category)).toBe(true);
    }
  });

  it('still marks priority items as hard', () => {
    const hard = sot826Phrases.filter((p) => p.difficulty === 'hard');
    expect(hard.length).toBeGreaterThan(0);
    for (const entry of hard) {
      expect(KNOWN_CATEGORIES.has(entry.category)).toBe(true);
    }
  });
});
