'use client';

import Link from 'next/link';
import LogoutButton from '@/components/ui/LogoutButton';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useI18n } from '@/i18n/I18nContext';

export default function AppHeader() {
  const { t } = useI18n();
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <span className="brand-text">{t('header.brand')}</span>
      </Link>
      <div className="header-actions">
        <LanguageToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
