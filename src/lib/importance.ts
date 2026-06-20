import { Importance } from '@/types/phrase';

/** Importance levels in display order (most important first). */
export const IMPORTANCE_VALUES: Importance[] = ['high', 'normal', 'low'];

/** Full Japanese labels for selectors. */
export const IMPORTANCE_LABEL: Record<Importance, string> = {
  high: '高い',
  normal: '普通',
  low: '低い',
};

/**
 * Compact single-character labels for dense table cells. These mirror the full
 * labels (高い / 普通 / 低い) so the same three-level scale is shown everywhere —
 * `normal` is 普 (普通), never 中, to avoid mixing a "medium" level into the UI.
 */
export const IMPORTANCE_SHORT: Record<Importance, string> = {
  high: '高',
  normal: '普',
  low: '低',
};

/** Default importance for phrases that have not been classified yet. */
export const DEFAULT_IMPORTANCE: Importance = 'normal';

export function isImportance(value: unknown): value is Importance {
  return value === 'high' || value === 'normal' || value === 'low';
}

/**
 * Narrow a list of review items to a single importance level, preserving the
 * input order. Returns the list unchanged when `importance` is null/undefined
 * (i.e. "all"). Callers must filter BEFORE applying SRS ordering so that order
 * survives — this helper keeps relative order intact to make that safe.
 */
export function filterByImportance<T extends { phrase: { importance: Importance } }>(
  items: T[],
  importance: Importance | null | undefined,
): T[] {
  if (!importance) return items;
  return items.filter((item) => item.phrase.importance === importance);
}
