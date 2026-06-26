'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nContext';

// モバイル用のボトムタブバー（SOT-1020 / 提案6）。
// 480px以下でのみ表示（globals.css の .bottom-tabs メディアクエリ参照）。
// アイコンは currentColor の線画SVGで、アクティブ時は var(--primary) になる。

const svg = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const HomeIcon = () => (
  <svg {...svg}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
const PhrasesIcon = () => (
  <svg {...svg}><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
);
const CalendarIcon = () => (
  <svg {...svg}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18" /><path d="M8 2v4" /><path d="M16 2v4" /></svg>
);
const AnalyticsIcon = () => (
  <svg {...svg}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></svg>
);
type Tab = { href: string; labelKey: string; icon: ReactNode; match: (path: string) => boolean };

const TABS: Tab[] = [
  { href: '/', labelKey: 'tab.home', icon: <HomeIcon />, match: p => p === '/' },
  { href: '/phrases', labelKey: 'tab.phrases', icon: <PhrasesIcon />, match: p => p.startsWith('/phrases') },
  { href: '/analytics', labelKey: 'tab.analytics', icon: <AnalyticsIcon />, match: p => p.startsWith('/analytics') },
  { href: '/calendar', labelKey: 'tab.calendar', icon: <CalendarIcon />, match: p => p.startsWith('/calendar') },
];

export default function BottomTabBar() {
  const { t } = useI18n();
  const pathname = usePathname() ?? '/';
  // ログイン画面ではタブを出さない。
  if (pathname.startsWith('/login')) return null;

  return (
    <nav className="bottom-tabs" aria-label={t('tab.home')}>
      {TABS.map(tab => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? 'bottom-tab active' : 'bottom-tab'}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-tab-icon">{tab.icon}</span>
            <span className="bottom-tab-label">{t(tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
