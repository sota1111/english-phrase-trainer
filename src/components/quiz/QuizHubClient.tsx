'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nContext';
import { QuizPhrase } from '@/lib/quiz';
import { QuizClient } from '@/components/quiz/QuizClient';
import { WritingClient } from '@/components/writing/WritingClient';

type HubMode = 'quiz' | 'writing';

type Props = {
  phrases: QuizPhrase[];
};

export function QuizHubClient({ phrases }: Props) {
  const { t } = useI18n();
  const [mode, setMode] = useState<HubMode>('quiz');

  const tabs: { key: HubMode; label: string }[] = [
    { key: 'quiz', label: t('tab.quiz') },
    { key: 'writing', label: t('tab.writing') },
  ];

  return (
    <div className="quiz-hub">
      <div className="hub-tabs" role="tablist" aria-label={t('tab.quiz')}>
        {/* 復習はホームの復習画面 (/spaced-review) に統一 (SOT-1226)。 */}
        <Link href="/spaced-review" className="hub-tab" role="tab" aria-selected={false}>
          {t('tab.review')}
        </Link>
        {tabs.map((tab) => {
          const active = mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? 'hub-tab active' : 'hub-tab'}
              onClick={() => setMode(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {mode === 'quiz' && <QuizClient phrases={phrases} />}
        {mode === 'writing' && <WritingClient phrases={phrases} />}
      </div>

      <style jsx>{`
        .hub-tabs {
          display: flex;
          gap: 0.35rem;
          max-width: 640px;
          margin: 0 auto;
          padding: 1.5rem 1.25rem 0;
        }
        .hub-tab {
          flex: 1;
          padding: 0.65rem 0.75rem;
          border: 1px solid transparent;
          border-radius: 999px;
          background: var(--surface-muted, #f1f3f6);
          color: var(--muted, #5b6472);
          font-size: 0.95rem;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .hub-tab:hover {
          background: var(--primary-soft, #e8f0fe);
          color: var(--primary-soft-fg, #1d4ed8);
        }
        .hub-tab.active {
          background: var(--primary, #2563eb);
          border-color: var(--primary, #2563eb);
          color: #fff;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
