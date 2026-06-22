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
};

type Props = {
  items: ReviewItem[];
};

export function SpacedReviewClient({ items }: Props) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState<'en-to-ja' | 'ja-to-en'>('en-to-ja');
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  const changeDirection = (next: 'en-to-ja' | 'ja-to-en') => {
    setDirection(next);
    setShowAnswer(false);
  };

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

  const isEnToJa = direction === 'en-to-ja';
  const promptText = isEnToJa ? current.phrase.phrase : current.phrase.meaningJa;
  const promptSub = isEnToJa ? current.phrase.example : current.phrase.exampleJa;
  const answerText = isEnToJa ? current.phrase.meaningJa : current.phrase.phrase;
  const answerSub = isEnToJa ? current.phrase.exampleJa : current.phrase.example;

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
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ color: '#374151', fontSize: '0.9rem' }}>
          {t('review.remaining', { remaining, total: items.length })}
        </span>
        <div style={{ display: 'inline-flex', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => changeDirection('en-to-ja')}
            style={{ padding: '0.4rem 0.8rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: isEnToJa ? '#0070f3' : '#fff', color: isEnToJa ? '#fff' : '#374151' }}
          >
            {t('review.direction.enToJa')}
          </button>
          <button
            onClick={() => changeDirection('ja-to-en')}
            style={{ padding: '0.4rem 0.8rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: !isEnToJa ? '#0070f3' : '#fff', color: !isEnToJa ? '#fff' : '#374151' }}
          >
            {t('review.direction.jaToEn')}
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '2rem', marginBottom: '1.5rem', background: '#fff' }}>
        <p style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111' }}>
          {promptText}
        </p>
        {promptSub && (
          <p style={{ color: '#374151', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {t('review.example')}: {promptSub}
          </p>
        )}

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            style={{ padding: '0.6rem 1.2rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}
          >
            {isEnToJa ? t('review.showMeaning') : t('review.showEnglish')}
          </button>
        ) : (
          <div>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#111' }}>{answerText}</p>
              {answerSub && (
                <p style={{ color: '#111', fontSize: '0.9rem' }}>{answerSub}</p>
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
