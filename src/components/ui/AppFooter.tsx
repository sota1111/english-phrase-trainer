'use client';

import { useI18n } from '@/i18n/I18nContext';

export default function AppFooter() {
  const { t } = useI18n();
  return <footer className="app-footer">{t('footer.tagline')}</footer>;
}
