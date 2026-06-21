import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  orderByReviewUrgency,
  shuffle,
  DEFAULT_SM2_PARAMS,
  type SM2Params,
} from '@/lib/sm2';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar-day offset of `dueDate` from now, rounded to avoid midnight-boundary flakiness. */
function dayOffsetFromNow(dueDate: Date): number {
  return Math.round((dueDate.getTime() - Date.now()) / DAY_MS);
}

describe('calculateNextReview', () => {
  it('first correct answer from defaults: interval 1, EF +0.1, reps 1', () => {
    const result = calculateNextReview(DEFAULT_SM2_PARAMS, true);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.6, 5);
    expect(dayOffsetFromNow(result.dueDate)).toBe(1);
  });

  it('second correct answer: interval becomes 6', () => {
    const params: SM2Params = { easeFactor: 2.6, interval: 1, repetitions: 1 };
    const result = calculateNextReview(params, true);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
    expect(dayOffsetFromNow(result.dueDate)).toBe(6);
  });

  it('third+ correct answer: interval = round(interval * easeFactor)', () => {
    const params: SM2Params = { easeFactor: 2.7, interval: 6, repetitions: 2 };
    const result = calculateNextReview(params, true);
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * 2.7)); // 16
    expect(result.easeFactor).toBeCloseTo(2.8, 5);
  });

  it('incorrect answer resets reps/interval and lowers EF by 0.2', () => {
    const params: SM2Params = { easeFactor: 2.5, interval: 10, repetitions: 5 };
    const result = calculateNextReview(params, false);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.3, 5);
    expect(dayOffsetFromNow(result.dueDate)).toBe(1);
  });

  it('easeFactor never drops below 1.3 on incorrect answers', () => {
    const params: SM2Params = { easeFactor: 1.3, interval: 5, repetitions: 3 };
    const result = calculateNextReview(params, false);
    expect(result.easeFactor).toBe(1.3);
  });

  it('correct and incorrect produce different next intervals from the same params', () => {
    const params: SM2Params = { easeFactor: 2.5, interval: 10, repetitions: 5 };
    const correct = calculateNextReview(params, true);
    const incorrect = calculateNextReview(params, false);
    expect(correct.interval).not.toBe(incorrect.interval);
    expect(correct.interval).toBeGreaterThan(incorrect.interval);
  });
});

describe('orderByReviewUrgency', () => {
  it('orders scheduled items ascending by due time (most overdue first)', () => {
    const items = [
      { id: 'c', due: 300 },
      { id: 'a', due: 100 },
      { id: 'b', due: 200 },
    ];
    const ordered = orderByReviewUrgency(items, i => i.due);
    expect(ordered.map(i => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('places null-due (never scheduled) items last, preserving their order', () => {
    const items = [
      { id: 'n1', due: null },
      { id: 's2', due: 200 },
      { id: 'n2', due: null },
      { id: 's1', due: 100 },
    ];
    const ordered = orderByReviewUrgency(items, i => i.due);
    expect(ordered.map(i => i.id)).toEqual(['s1', 's2', 'n1', 'n2']);
  });

  it('does not mutate the input array', () => {
    const items = [
      { id: 'b', due: 200 },
      { id: 'a', due: 100 },
    ];
    const snapshot = items.map(i => i.id);
    orderByReviewUrgency(items, i => i.due);
    expect(items.map(i => i.id)).toEqual(snapshot);
  });
});

describe('shuffle', () => {
  it('returns a deterministic non-mutating permutation with an injected rng', () => {
    const items = ['a', 'b', 'c', 'd'];
    const rngValues = [0.1, 0.8, 0.3];
    const rng = () => rngValues.shift() ?? 0;

    const shuffled = shuffle(items, rng);

    expect(shuffled).toEqual(['b', 'd', 'c', 'a']);
    expect(shuffled).not.toEqual(items);
    expect([...shuffled].sort()).toEqual([...items].sort());
    expect(items).toEqual(['a', 'b', 'c', 'd']);
  });
});
