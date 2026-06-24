'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nContext';

export default function LogoutButton() {
  const router = useRouter();
  const { t } = useI18n();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="btn btn-ghost"
      aria-label={t('header.logout')}
      title={t('header.logout')}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}
