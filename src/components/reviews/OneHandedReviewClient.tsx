'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { submitReviewResultAction } from '@/lib/actions/reviewActions';

export type Phrase = {
  id: string;
  phrase: string;
  meaningJa: string;
  example: string;
  exampleJa: string;
};

export type ReviewItem = {
  phrase: Phrase;
  schedule: unknown;
};

type Props = {
  items: ReviewItem[];
};

export function OneHandedReviewClient({ items }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>今日の復習はありません</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>新しいフレーズを追加するか、明日また来てください。</p>
        <Link href="/" style={{ color: '#0070f3', fontWeight: 'bold' }}>ホームへ戻る</Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>復習完了！</h2>
        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            覚えていた: <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{results.correct}</span> 件
          </p>
          <p style={{ fontSize: '1.1rem' }}>
            覚えていなかった: <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{results.incorrect}</span> 件
          </p>
        </div>
        <Link href="/" style={{ padding: '1rem 2rem', background: '#0070f3', color: '#fff', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', fontSize: '1.1rem', fontWeight: 'bold' }}>
          ホームへ戻る
        </Link>
      </div>
    );
  }

  const current = items[currentIndex];
  const total = items.length;

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
      </div>

      {/* Card Content */}
      <div 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', textAlign: 'center' }}
        onClick={() => !showAnswer && setShowAnswer(true)}
      >
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', wordBreak: 'break-word' }}>
            {current.phrase.phrase}
          </h2>
          {current.phrase.example && (
            <p style={{ color: '#666', fontSize: '1.1rem', fontStyle: 'italic' }}>
              {current.phrase.example}
            </p>
          )}
        </div>

        {showAnswer && (
          <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
            <div style={{ height: '1px', background: '#eee', margin: '2rem 0' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111', marginBottom: '0.5rem' }}>
              {current.phrase.meaningJa}
            </p>
            {current.phrase.exampleJa && (
              <p style={{ color: '#666', fontSize: '1rem' }}>
                {current.phrase.exampleJa}
              </p>
            )}
          </div>
        )}
      </div>

      {/* One-handed Controls */}
      <div style={{ 
        padding: `16px 16px calc(env(safe-area-inset-bottom) + 16px)`,
        background: '#fff',
        borderTop: '1px solid #eee'
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
            意味を表示
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
              ✗ 覚えていない
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
              ✓ 覚えている
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
