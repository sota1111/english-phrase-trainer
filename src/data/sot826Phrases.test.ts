import { describe, it, expect } from 'vitest';
import { sot826Phrases } from './sot826Phrases';
import { phraseInputSchema } from '@/lib/validation/schemas';
import { hasPhraseAnnotation } from '@/lib/phraseText';

// SOT-866: categories reorganized into three broad topical buckets.
const KNOWN_CATEGORIES = new Set(['ビジネス', '技術', '日常']);

describe('sot826Phrases dataset', () => {
  // SOT-865: 22 phrase-field entries carrying Japanese annotations
  // ((優先暗記)/(セット表現)/(重要動詞)) were removed as duplicates, dropping the
  // count from 245 to 223.
  it('has at least 220 entries', () => {
    expect(sot826Phrases.length).toBeGreaterThanOrEqual(220);
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

  it('keeps phrases English-only (no Japanese annotation in phrase)', () => {
    for (const entry of sot826Phrases) {
      expect(hasPhraseAnnotation(entry.phrase)).toBe(false);
    }
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
