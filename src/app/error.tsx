'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nContext';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container" style={{ textAlign: 'center' }}>
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden>⚠️</div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{t('error.title')}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.75rem' }}>
          {t('error.body')}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => reset()} className="btn btn-primary">
            {t('error.retry')}
          </button>
          <Link href="/" className="btn btn-ghost">
            {t('common.home')}
          </Link>
        </div>
      </div>
    </main>
  );
}
