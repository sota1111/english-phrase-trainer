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
      {/*
        復習 / クイズ / 英作文 の選択は、横一列に連結したトグルボタン
        (セグメントコントロール) で3種類を切り替える (SOT-1266)。
      */}
      <nav className="hub-toggle" role="tablist" aria-label={t('tab.quiz')}>
        {/* 復習はホームの復習画面 (/spaced-review) に統一 (SOT-1226)。 */}
        <Link href="/spaced-review" className="hub-toggle-item" role="tab" aria-selected={false} data-testid="hub-tab-review">
          <ReviewIcon />
          <span className="hub-toggle-label">{t('tab.review')}</span>
        </Link>
        {tabs.map((tab) => {
          const active = mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? 'hub-toggle-item active' : 'hub-toggle-item'}
              onClick={() => setMode(tab.key)}
              data-testid={`hub-tab-${tab.key}`}
            >
              {tab.key === 'quiz' ? <QuizIcon /> : <WritingIcon />}
              <span className="hub-toggle-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div role="tabpanel">
        {mode === 'quiz' && <QuizClient phrases={phrases} />}
        {mode === 'writing' && <WritingClient phrases={phrases} />}
      </div>

      <style jsx>{`
        .hub-toggle {
          display: flex;
          max-width: 640px;
          margin: 1.5rem auto 0;
          border: 1px solid var(--border, #e4e7ec);
          border-radius: var(--radius, 12px);
          overflow: hidden;
          background: var(--surface, #ffffff);
        }
        .hub-toggle-item {
          flex: 1 1 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.7rem 0.5rem;
          border: 0;
          border-left: 1px solid var(--border, #e4e7ec);
          background: transparent;
          color: var(--foreground, #1a2230);
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .hub-toggle-item:first-child {
          border-left: 0;
        }
        .hub-toggle-item:hover {
          background: var(--primary-soft, #e8f0fe);
        }
        .hub-toggle-item.active {
          background: var(--primary, #2563eb);
          color: #fff;
          font-weight: 700;
        }
        .hub-toggle-item :global(svg) {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

// 復習 — 循環する矢印（繰り返し学習）
function ReviewIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

// クイズ — はてなマークの円
function QuizIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

// 英作文 — ペン
function WritingIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
