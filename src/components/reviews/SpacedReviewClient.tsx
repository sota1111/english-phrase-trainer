'use client';

import Link from 'next/link';
import { useState } from 'react';
import { submitReviewResultAction } from '@/lib/actions/reviewActions';
import { useI18n } from '@/i18n/I18nContext';

type Phrase = {
  id: string;
  phrase: string;
  meaningJa: string;
  example: string;
  exampleJa: string;
};

type ReviewItem = {
  phrase: Phrase;
  schedule: unknown;
};

type Props = {
  items: ReviewItem[];
};

export function SpacedReviewClient({ items }: Props) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>{t('review.none.title')}</h2>
        <p>{t('review.none.body')}</p>
        <Link href="/" style={{ color: '#0070f3' }}>{t('common.home')}</Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>{t('review.done.title')}</h2>
        <p>{t('review.remembered')}: {results.correct} {t('unit.count')}</p>
        <p>{t('review.forgot')}: {results.incorrect} {t('unit.count')}</p>
        <Link href="/" style={{ padding: '0.75rem 1.5rem', background: '#0070f3', color: '#fff', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          {t('common.home')}
        </Link>
      </div>
    );
  }

  const current = items[currentIndex];
  const remaining = items.length - currentIndex;

  const handleAnswer = async (isCorrect: boolean) => {
    await submitReviewResultAction({ phraseId: current.phrase.id, isCorrect });

    setResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    if (currentIndex + 1 >= items.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.95rem' }}>
          {t('common.backHome')}
        </Link>
      </div>
      <div style={{ marginBottom: '1rem', color: '#374151', fontSize: '0.9rem' }}>
        {t('review.remaining', { remaining, total: items.length })}
      </div>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '2rem', marginBottom: '1.5rem', background: '#fff' }}>
        <p style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111' }}>
          {current.phrase.phrase}
        </p>
        {current.phrase.example && (
          <p style={{ color: '#374151', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {t('review.example')}: {current.phrase.example}
          </p>
        )}

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            style={{ padding: '0.6rem 1.2rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}
          >
            {t('review.showMeaning')}
          </button>
        ) : (
          <div>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{current.phrase.meaningJa}</p>
              {current.phrase.exampleJa && (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{current.phrase.exampleJa}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleAnswer(true)}
                style={{ flex: 1, padding: '0.75rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {t('review.answer.remembered')}
              </button>
              <button
                onClick={() => handleAnswer(false)}
                style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {t('review.answer.forgot')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
