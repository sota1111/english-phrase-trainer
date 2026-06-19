import { describe, it, expect } from 'vitest';
import { sot826Phrases } from './sot826Phrases';
import { phraseInputSchema } from '@/lib/validation/schemas';

const KNOWN_CATEGORIES = new Set([
  '最優先',
  '技術報告',
  '確認依頼',
  'ビルド・環境',
  '手順説明',
  'RMF・ロボット',
  'ビジネス・導入',
  'PM・顧客対応',
  '課金・契約',
  'Excel・管理表',
  '重要動詞',
  '自然な言い換え',
  'セット表現',
  'テンプレート',
  '優先暗記',
]);

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

  it('only uses the 15 known SOT-826 categories', () => {
    for (const entry of sot826Phrases) {
      expect(KNOWN_CATEGORIES.has(entry.category)).toBe(true);
    }
  });

  it('marks only the priority categories (最優先 / 優先暗記) as hard', () => {
    for (const entry of sot826Phrases) {
      if (entry.difficulty === 'hard') {
        expect(['最優先', '優先暗記']).toContain(entry.category);
      }
    }
    const hard = sot826Phrases.filter((p) => p.difficulty === 'hard');
    expect(hard.length).toBeGreaterThan(0);
  });
});
