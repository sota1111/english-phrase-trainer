import { describe, it, expect } from 'vitest';
import { filterByImportance, isImportance, IMPORTANCE_LABEL, IMPORTANCE_SHORT } from './importance';
import { phraseInputSchema } from './validation/schemas';
import { Importance } from '@/types/phrase';

type Item = { id: string; phrase: { importance: Importance } };

const mk = (id: string, importance: Importance): Item => ({ id, phrase: { importance } });

describe('isImportance', () => {
  it('accepts the three importance levels', () => {
    expect(isImportance('high')).toBe(true);
    expect(isImportance('normal')).toBe(true);
    expect(isImportance('low')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isImportance('urgent')).toBe(false);
    expect(isImportance('')).toBe(false);
    expect(isImportance(undefined)).toBe(false);
  });
});

describe('importance labels use the 高い/普通/低い scale only', () => {
  it('uses 普通/普 for normal — never 中 (no medium level leaks into the UI)', () => {
    expect(IMPORTANCE_LABEL.normal).toBe('普通');
    expect(IMPORTANCE_SHORT.normal).toBe('普');
    expect(Object.values(IMPORTANCE_SHORT)).not.toContain('中');
    expect(Object.values(IMPORTANCE_LABEL)).not.toContain('中');
  });

  it('maps all three levels to consistent short labels', () => {
    expect(IMPORTANCE_SHORT).toEqual({ high: '高', normal: '普', low: '低' });
  });
});

describe('filterByImportance', () => {
  it('returns all items when importance is null/undefined (= "all")', () => {
    const items = [mk('a', 'high'), mk('b', 'low')];
    expect(filterByImportance(items, null)).toHaveLength(2);
    expect(filterByImportance(items, undefined)).toHaveLength(2);
  });

  it('keeps only items of the requested importance', () => {
    const items = [mk('a', 'high'), mk('b', 'low'), mk('c', 'high'), mk('d', 'normal')];
    const result = filterByImportance(items, 'high');
    expect(result.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('preserves input order so SRS urgency ordering survives the filter', () => {
    // Pre-ordered by SRS urgency: a, b, c all high.
    const items = [mk('a', 'high'), mk('x', 'low'), mk('b', 'high'), mk('y', 'normal'), mk('c', 'high')];
    const result = filterByImportance(items, 'high');
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('phraseInputSchema importance default', () => {
  it('defaults unclassified input to "normal"', () => {
    const parsed = phraseInputSchema.parse({ phrase: 'set up', meaningJa: '準備する' });
    expect(parsed.importance).toBe('normal');
  });

  it('keeps an explicit importance', () => {
    const parsed = phraseInputSchema.parse({ phrase: 'set up', meaningJa: '準備する', importance: 'high' });
    expect(parsed.importance).toBe('high');
  });

  it('rejects an invalid importance', () => {
    expect(() =>
      phraseInputSchema.parse({ phrase: 'set up', meaningJa: '準備する', importance: 'urgent' }),
    ).toThrow();
  });
});
