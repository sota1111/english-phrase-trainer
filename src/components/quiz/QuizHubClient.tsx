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
        復習 / クイズ / 英作文 の選択は、本リポジトリ既存のトグル部品
        LanguageToggle (src/components/ui/LanguageToggle.tsx, toddler-private-rag の
        RoleToggle/LanguageToggle と同一デザイン) を踏襲する (SOT-1266)。
        横並びの連結セグメント型ピル: 外枠1本・角丸999px・overflow:hidden、
        選択中=青塗り+白文字 / 非選択=透明+muted。
      */}
      <nav className="hub-menu" role="tablist" aria-label={t('tab.quiz')}>
        {/* 復習はホームの復習画面 (/spaced-review) に統一 (SOT-1226)。 */}
        <Link href="/spaced-review" className="hub-menu-item" role="tab" aria-selected={false} data-testid="hub-tab-review">
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
              className={active ? 'hub-menu-item active' : 'hub-menu-item'}
              onClick={() => setMode(tab.key)}
              data-testid={`hub-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div role="tabpanel">
        {mode === 'quiz' && <QuizClient phrases={phrases} />}
        {mode === 'writing' && <WritingClient phrases={phrases} />}
      </div>

      <style jsx>{`
        /* LanguageToggle 踏襲: 連結セグメント型ピル。中央寄せ。 */
        .hub-menu {
          display: flex;
          width: fit-content;
          margin: 1.5rem auto 0;
          border: 1px solid var(--border, #e4e7ec);
          border-radius: 999px;
          overflow: hidden;
        }
        /* 各セグメント: 枠線なし・透明背景・muted 文字。隙間なしで連結。 */
        .hub-menu-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.55rem 1.1rem;
          border: none;
          background: transparent;
          color: var(--muted, #667085);
          /*
            復習は <a>(Link)、クイズ/英作文は <button>。<button> は font-family を
            継承しないため、明示しないと復習だけフォント/サイズが揃わない (SOT-1266)。
            font-family を inherit して3セグメントの文字フォント・サイズを統一する。
          */
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        /* セグメント間の細い区切り線 (最初以外)。 */
        .hub-menu-item + .hub-menu-item {
          border-left: 1px solid var(--border, #e4e7ec);
        }
        .hub-menu-item:hover:not(.active) {
          background: color-mix(in srgb, var(--primary, #2563eb) 10%, transparent);
        }
        /* 選択中=青塗り+白文字 (LanguageToggle と同一)。 */
        .hub-menu-item.active {
          background: var(--primary, #2563eb);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
