'use client';

import { useI18n } from '@/i18n/I18nContext';

/**
 * Renders a translated UI-shell string. Usable inside server components so a
 * page need not become a client component just to localize its text.
 */
export function T({
  k,
  vars,
}: {
  k: string;
  vars?: Record<string, string | number>;
}) {
  const { t } = useI18n();
  return <>{t(k, vars)}</>;
}
