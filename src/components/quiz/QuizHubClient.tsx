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
        復習 / クイズ / 英作文 の選択は、toddler-private-rag の RegisterMenu と
        サイズ・デザインを1対1で踏襲する (SOT-1266)。横並びの個別カードボタン
        (アイコンを上・ラベルを下) で、モバイルは3カラム / PC は中央寄せ。
      */}
      <nav className="hub-menu" role="tablist" aria-label={t('tab.quiz')}>
        {/* 復習はホームの復習画面 (/spaced-review) に統一 (SOT-1226)。 */}
        <Link href="/spaced-review" className="hub-menu-item" role="tab" aria-selected={false} data-testid="hub-tab-review">
          <ReviewIcon />
          <span className="hub-menu-label">{t('tab.review')}</span>
        </Link>
        {tabs.map((tab) => {
          const active = mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? 'hub-menu-item active' : 'hub-menu-item'}
              onClick={() => setMode(tab.key)}
              data-testid={`hub-tab-${tab.key}`}
            >
              {tab.key === 'quiz' ? <QuizIcon /> : <WritingIcon />}
              <span className="hub-menu-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div role="tabpanel">
        {mode === 'quiz' && <QuizClient phrases={phrases} />}
        {mode === 'writing' && <WritingClient phrases={phrases} />}
      </div>

      <style jsx>{`
        /* toddler RegisterMenu 踏襲: モバイル=3カラムグリッド, gap-2 (0.5rem) */
        .hub-menu {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin: 1.5rem 0 0;
        }
        /* 各ボタン: 隙間を空けた個別の角丸カード, アイコン上・ラベル下の縦並び中央寄せ */
        .hub-menu-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.75rem;
          border: 1px solid var(--border, #e4e7ec);
          border-radius: var(--radius, 12px);
          background: var(--surface, #ffffff);
          color: var(--foreground, #1a2230);
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
        }
        .hub-menu-item:hover {
          border-color: color-mix(in srgb, var(--primary, #2563eb) 40%, transparent);
          background: color-mix(in srgb, var(--primary, #2563eb) 10%, var(--surface, #ffffff));
        }
        .hub-menu-item.active {
          border-color: var(--primary, #2563eb);
          background: var(--primary, #2563eb);
          color: #fff;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
        }
        .hub-menu-item :global(svg) {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        /* PC: 中身幅で中央寄せ (toddler sm:inline-flex sm:gap-3) */
        @media (min-width: 640px) {
          .hub-menu {
            display: inline-flex;
            gap: 0.75rem;
          }
          .hub-menu-item {
            padding: 0.75rem 1.25rem;
          }
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
