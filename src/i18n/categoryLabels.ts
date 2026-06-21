// Display-only label map for phrase categories. Stored category values stay
// Japanese (used as <option value> and persisted/filtered as-is); this only
// translates the visible text when the UI language is English. Unknown
// (user-added) categories fall back to their raw stored value.
import { Lang } from '@/i18n/messages';

const CATEGORY_EN: Record<string, string> = {
  技術: 'Technology',
  日常: 'Daily',
  ビジネス: 'Business',
};

export function categoryLabel(category: string, lang: Lang): string {
  if (lang === 'en') return CATEGORY_EN[category] ?? category;
  return category;
}
