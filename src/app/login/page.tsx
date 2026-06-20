'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nContext';

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t('login.errAuth'));
      }
    } catch {
      setError(t('login.errLogin'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 'calc(100vh - var(--header-h))', padding: '1.5rem' }}>
      <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: '380px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="brand-mark" style={{ width: 44, height: 44, fontSize: '1.2rem', margin: '0 auto 0.85rem', display: 'inline-flex' }}>英</span>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>{t('header.brand')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('login.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email" className="field-label">{t('login.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input"
              placeholder="your-email@example.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password" className="field-label">{t('login.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="input"
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>
          {error && (
            <p role="alert" className="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </main>
  );
}
