'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { QuizPhrase, shuffle } from '@/lib/quiz';

type Feedback = {
  score: number;
  corrected: string;
  usesPhrase: boolean;
  goodPoints: string[];
  improvements: string[];
  comment: string;
};

type Status = 'idle' | 'loading' | 'done' | 'info' | 'error';

export function WritingClient({ phrases }: { phrases: QuizPhrase[] }) {
  const { t } = useI18n();
  const deck = useMemo(() => shuffle(phrases), [phrases]);
  const [index, setIndex] = useState(0);
  const [sentence, setSentence] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [message, setMessage] = useState('');

  const current = deck[index % Math.max(deck.length, 1)];

  const reset = () => {
    setSentence('');
    setStatus('idle');
    setFeedback(null);
    setMessage('');
  };

  const nextPhrase = () => {
    setIndex((i) => i + 1);
    reset();
  };

  const submit = async () => {
    if (!current || !sentence.trim() || status === 'loading') return;
    setStatus('loading');
    setFeedback(null);
    setMessage('');
    try {
      const res = await fetch('/api/phrases/writing-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrase: current.phrase,
          meaningJa: current.meaningJa,
          sentence: sentence.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setStatus('info');
        setMessage(data?.message || t('writing.unavailable'));
        return;
      }
      if (!res.ok || !data?.result) {
        setStatus('error');
        setMessage(data?.message || t('writing.error'));
        return;
      }
      setFeedback(data.result as Feedback);
      setStatus('done');
    } catch {
      setStatus('error');
      setMessage(t('writing.error'));
    }
  };

  // ---- Empty ----
  if (phrases.length === 0) {
    return (
      <div className="writing">
        <header className="writing-header">
          <h1>{t('writing.title')}</h1>
          <p className="subtitle">{t('writing.subtitle')}</p>
        </header>
        <p className="empty">{t('writing.empty')}</p>
        <WritingStyles />
      </div>
    );
  }

  const scoreClass = feedback
    ? feedback.score >= 80
      ? 'score high'
      : feedback.score >= 50
      ? 'score mid'
      : 'score low'
    : 'score';

  return (
    <div className="writing">
      <header className="writing-header">
        <h1>{t('writing.title')}</h1>
        <p className="subtitle">{t('writing.subtitle')}</p>
      </header>

      <div className="card">
        <p className="q-label">{t('writing.prompt')}</p>
        <p className="phrase">{current.phrase}</p>
        {current.meaningJa && <p className="meaning">{current.meaningJa}</p>}

        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          disabled={status === 'loading'}
          placeholder={t('writing.placeholder')}
          rows={3}
        />

        <div className="actions">
          <button
            className="primary"
            onClick={submit}
            disabled={!sentence.trim() || status === 'loading'}
          >
            {status === 'loading' ? t('writing.checking') : t('writing.check')}
          </button>
          <button className="ghost" onClick={nextPhrase} disabled={status === 'loading'}>
            {t('writing.skip')}
          </button>
        </div>

        {status === 'info' && <p className="notice info">{message}</p>}
        {status === 'error' && <p className="notice error">{message}</p>}

        {status === 'done' && feedback && (
          <div className="feedback">
            <div className="score-row">
              <div className="score-chip">
                <span className={scoreClass}>{feedback.score}</span>
                <span className="score-max">/ 100</span>
              </div>
              {!feedback.usesPhrase && (
                <span className="badge-warn">{t('writing.notUsed')}</span>
              )}
            </div>

            {feedback.corrected && (
              <div className="block">
                <p className="block-label">{t('writing.corrected')}</p>
                <p className="corrected">{feedback.corrected}</p>
              </div>
            )}

            {feedback.goodPoints.length > 0 && (
              <div className="block">
                <p className="block-label good">{t('writing.good')}</p>
                <ul>
                  {feedback.goodPoints.map((g, i) => (
                    <li key={`g${i}`}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.improvements.length > 0 && (
              <div className="block">
                <p className="block-label improve">{t('writing.improve')}</p>
                <ul>
                  {feedback.improvements.map((g, i) => (
                    <li key={`i${i}`}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.comment && <p className="comment">{feedback.comment}</p>}

            <button className="primary next" onClick={nextPhrase}>
              {t('writing.next')}
            </button>
          </div>
        )}
      </div>

      <WritingStyles />
    </div>
  );
}

function WritingStyles() {
  return (
    <style jsx>{`
      .writing {
        padding: 2rem 1.25rem 2.5rem;
        max-width: 640px;
        margin: 0 auto;
      }
      .writing-header {
        margin-bottom: 1.5rem;
      }
      h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      .subtitle {
        margin: 0.35rem 0 0;
        color: var(--muted);
        font-size: 0.92rem;
      }
      .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--muted);
        background: var(--surface);
        border: 1px dashed var(--border-strong);
        border-radius: var(--radius);
      }
      .card {
        padding: 1.75rem 1.5rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
      }
      .q-label {
        display: inline-block;
        margin: 0 0 0.75rem;
        padding: 0.25rem 0.6rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--primary-soft-fg);
        background: var(--primary-soft);
        border-radius: 999px;
      }
      .phrase {
        margin: 0 0 0.3rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--foreground);
        font-family: var(--font-serif-stack);
      }
      .meaning {
        margin: 0 0 1.25rem;
        color: var(--muted);
        font-size: 0.95rem;
      }
      textarea {
        width: 100%;
        padding: 0.85rem;
        border: 1.5px solid var(--border-strong);
        border-radius: var(--radius-sm);
        font-size: 1rem;
        background: var(--surface);
        color: var(--foreground);
        resize: vertical;
        font-family: inherit;
        line-height: 1.5;
        transition: border-color 0.12s ease, box-shadow 0.12s ease;
      }
      textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-soft);
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      button {
        padding: 0.6rem 1.4rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        border: none;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .primary {
        background: var(--primary);
        color: #fff;
      }
      .ghost {
        background: var(--surface-muted);
        color: var(--foreground);
        border: 1px solid var(--border);
      }
      .notice {
        margin: 1rem 0 0;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.9rem;
      }
      .notice.info {
        background: var(--surface-muted);
        color: var(--foreground);
        border: 1px solid var(--border);
      }
      .notice.error {
        background: #fee2e2;
        color: #7f1d1d;
        border: 1px solid #ef4444;
      }
      .feedback {
        margin-top: 1.25rem;
        border-top: 1px solid var(--border);
        padding-top: 1.25rem;
      }
      .score-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }
      .score-chip {
        display: inline-flex;
        align-items: baseline;
        gap: 0.3rem;
        padding: 0.5rem 1rem;
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: var(--radius);
      }
      .score {
        font-size: 2.2rem;
        font-weight: 800;
        color: var(--foreground);
        line-height: 1;
      }
      .score.high {
        color: var(--success);
      }
      .score.mid {
        color: var(--warning);
      }
      .score.low {
        color: var(--danger);
      }
      .score-max {
        color: var(--muted);
        font-size: 1rem;
        font-weight: 600;
      }
      .badge-warn {
        margin-left: auto;
        padding: 0.2rem 0.6rem;
        background: #fef3c7;
        color: #92400e;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .block {
        margin-bottom: 1rem;
      }
      .block-label {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--muted);
      }
      .block-label.good {
        color: #15803d;
      }
      .block-label.improve {
        color: #b45309;
      }
      .corrected {
        margin: 0;
        padding: 0.7rem 0.9rem;
        background: var(--surface-muted);
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 1.05rem;
        color: var(--foreground);
      }
      ul {
        margin: 0;
        padding-left: 1.2rem;
        color: var(--foreground);
      }
      li {
        margin-bottom: 0.25rem;
        font-size: 0.95rem;
      }
      .comment {
        margin: 0.5rem 0 0;
        color: var(--foreground);
        font-weight: 600;
      }
      .next {
        margin-top: 1rem;
      }
    `}</style>
  );
}
