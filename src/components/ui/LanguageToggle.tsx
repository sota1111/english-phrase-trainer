'use client';

import { useI18n } from '@/i18n/I18nContext';
import { Lang } from '@/i18n/messages';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'ja', label: 'JP' },
  { value: 'en', label: 'EN' },
];

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border)',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            style={{
              padding: '0.3rem 0.7rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
