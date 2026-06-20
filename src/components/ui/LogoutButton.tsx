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
      style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
    >
      {t('header.logout')}
    </button>
  );
}
