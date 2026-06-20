import { describe, it, expect } from 'vitest';
import { initialPhrases } from './initialPhrases';
import { sot826Phrases } from './sot826Phrases';
import { DEFAULT_IMPORTANCE, IMPORTANCE_VALUES } from '@/lib/importance';
import type { Importance } from '@/types/phrase';

/**
 * SOT-890: the combined seed datasets must classify phrases by importance at a
 * high:normal:low = 1:2:7 ratio (previously every phrase was 'normal'). 281 entries
 * -> high=28 (10%), normal=56 (20%), low=197 (70%). This lock keeps the ratio from
 * silently drifting when phrases are added or edited.
 */
describe('combined phrase importance distribution (SOT-890)', () => {
  const all = [...initialPhrases, ...sot826Phrases];

  const counts = (): Record<Importance, number> => {
    const c: Record<Importance, number> = { high: 0, normal: 0, low: 0 };
    for (const entry of all) {
      c[entry.importance ?? DEFAULT_IMPORTANCE] += 1;
    }
    return c;
  };

  it('only uses known importance levels', () => {
    for (const entry of all) {
      const value = entry.importance ?? DEFAULT_IMPORTANCE;
      expect(IMPORTANCE_VALUES).toContain(value);
    }
  });

  it('has 281 total entries', () => {
    expect(all.length).toBe(281);
  });

  it('classifies high:normal:low at exactly 28:56:197 (1:2:7)', () => {
    expect(counts()).toEqual({ high: 28, normal: 56, low: 197 });
  });

  it('matches the 1:2:7 ratio (within rounding of 281 entries)', () => {
    const c = counts();
    const unit = c.high; // the "1" in 1:2:7
    expect(unit).toBeGreaterThan(0);
    // normal is an exact 2x of high; low is 7x high up to <1 unit of rounding
    // (281 / 10 = 28.1, so the ideal low is 196.7, stored as 197).
    expect(c.normal).toBe(unit * 2);
    expect(Math.abs(c.low - unit * 7)).toBeLessThanOrEqual(1);
  });
});
