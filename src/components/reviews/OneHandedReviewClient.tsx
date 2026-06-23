'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { submitReviewResultAction } from '@/lib/actions/reviewActions';
import { useI18n } from '@/i18n/I18nContext';

export type Phrase = {
  id: string;
  phrase: string;
  meaningJa: string;
  example: string;
  exampleJa: string;
};

export type ReviewItem = {
  phrase: Phrase;
};

type Props = {
  items: ReviewItem[];
};

export function OneHandedReviewClient({ items }: Props) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState<'en-to-ja' | 'ja-to-en'>('en-to-ja');
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const changeDirection = (next: 'en-to-ja' | 'ja-to-en') => {
    setDirection(next);
    setShowAnswer(false);
  };
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('review.none.title')}</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>{t('review.none.body')}</p>
        <Link href="/" style={{ color: '#0070f3', fontWeight: 'bold' }}>{t('common.home')}</Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>{t('review.done.title')}</h2>
        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {t('review.remembered')}: <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{results.correct}</span> {t('unit.count')}
          </p>
          <p style={{ fontSize: '1.1rem' }}>
            {t('review.forgot')}: <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{results.incorrect}</span> {t('unit.count')}
          </p>
        </div>
        <Link href="/" style={{ padding: '1rem 2rem', background: '#0070f3', color: '#fff', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {t('common.home')}
        </Link>
      </div>
    );
  }

  const current = items[currentIndex];
  const total = items.length;

  const isEnToJa = direction === 'en-to-ja';
  const promptText = isEnToJa ? current.phrase.phrase : current.phrase.meaningJa;
  const promptSub = isEnToJa ? current.phrase.example : current.phrase.exampleJa;
  const answerText = isEnToJa ? current.phrase.meaningJa : current.phrase.phrase;
  const answerSub = isEnToJa ? current.phrase.exampleJa : current.phrase.example;

  const handleAnswer = async (isCorrect: boolean) => {
    if (submitting) return;
    setSubmitting(true);

    try {
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
    } catch (error) {
      console.error('Failed to submit result:', error);
      // Even if it fails, let's allow moving to the next to not get stuck,
      // but in a real app we might want to retry or show an error.
      // For this task, we follow "do not freeze".
      if (currentIndex + 1 >= items.length) {
        setCompleted(true);
      } else {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* Progress Header */}
      <div style={{ padding: '12px 16px 8px' }}>
        <ProgressBar current={currentIndex} total={total} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <div style={{ display: 'inline-flex', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={(e) => { e.stopPropagation(); changeDirection('en-to-ja'); }}
              style={{ padding: '0.35rem 0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: isEnToJa ? '#0070f3' : '#fff', color: isEnToJa ? '#fff' : '#374151' }}
            >
              {t('review.direction.enToJa')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); changeDirection('ja-to-en'); }}
              style={{ padding: '0.35rem 0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: !isEnToJa ? '#0070f3' : '#fff', color: !isEnToJa ? '#fff' : '#374151' }}
            >
              {t('review.direction.jaToEn')}
            </button>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', padding: '24px', textAlign: 'center' }}
        onClick={() => !showAnswer && setShowAnswer(true)}
      >
        <div style={{ margin: 'auto 0', width: '100%' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <h2 className={isEnToJa ? 'text-en' : undefined} style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', wordBreak: 'break-word', color: 'var(--foreground)' }}>
              {promptText}
            </h2>
            {promptSub && (
              <p className={isEnToJa ? 'text-en' : undefined} style={{ color: 'var(--muted)', fontSize: '1.1rem', fontStyle: 'italic' }}>
                {promptSub}
              </p>
            )}
          </div>

          {showAnswer && (
            <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
              <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
              <p className={!isEnToJa ? 'text-en' : undefined} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                {answerText}
              </p>
              {answerSub && (
                <p className={!isEnToJa ? 'text-en' : undefined} style={{ color: 'var(--foreground)', fontSize: '1rem' }}>
                  {answerSub}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* One-handed Controls */}
      <div style={{
        padding: `16px 16px calc(env(safe-area-inset-bottom) + 16px)`,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)'
      }}>
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            style={{
              width: '100%',
              height: '64px',
              background: '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 112, 243, 0.2)'
            }}
          >
            {isEnToJa ? t('review.showMeaningShort') : t('review.showEnglishShort')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              disabled={submitting}
              onClick={() => handleAnswer(false)}
              style={{
                flex: 1,
                height: '64px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t('review.answer.forgotShort')}
            </button>
            <button
              disabled={submitting}
              onClick={() => handleAnswer(true)}
              style={{
                flex: 1,
                height: '64px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t('review.answer.rememberedShort')}
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
