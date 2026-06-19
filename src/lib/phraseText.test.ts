import { describe, it, expect } from 'vitest';
import { hasPhraseAnnotation, stripPhraseAnnotation } from './phraseText';

describe('phraseText annotation helpers (SOT-865)', () => {
  const annotated = [
    'as a result (優先暗記)',
    'already in place (セット表現)',
    'visualize (重要動詞)',
    'move forward （優先暗記）', // full-width parens
  ];

  it('detects Japanese annotations (half- and full-width parens)', () => {
    for (const p of annotated) {
      expect(hasPhraseAnnotation(p)).toBe(true);
    }
  });

  it('reports no annotation on clean English phrases', () => {
    for (const p of ['as a result', 'move forward', 'Could you please advise?']) {
      expect(hasPhraseAnnotation(p)).toBe(false);
    }
  });

  it('strips annotations down to the English phrase', () => {
    expect(stripPhraseAnnotation('as a result (優先暗記)')).toBe('as a result');
    expect(stripPhraseAnnotation('already in place (セット表現)')).toBe('already in place');
    expect(stripPhraseAnnotation('visualize (重要動詞)')).toBe('visualize');
    expect(stripPhraseAnnotation('move forward （優先暗記）')).toBe('move forward');
  });

  it('is idempotent and leaves clean phrases unchanged', () => {
    expect(stripPhraseAnnotation('as a result')).toBe('as a result');
    expect(stripPhraseAnnotation(stripPhraseAnnotation('as a result (優先暗記)'))).toBe(
      'as a result',
    );
  });
});
