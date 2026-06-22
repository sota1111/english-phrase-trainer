'use client';

import { Importance } from '@/types/phrase';
import { IMPORTANCE_VALUES } from '@/lib/importance';
import { useI18n } from '@/i18n/I18nContext';
import { categoryLabel } from '@/i18n/categoryLabels';

export type FilterState = {
  keyword: string;
  category: string;
  importance: '' | Importance;
  deck: string;
  tag: string;
  onlyUnanswered: boolean;
  onlyWeak: boolean;
};

type PhraseFilterProps = {
  categories: string[];
  decks: string[];
  tags: string[];
  filter: FilterState;
  onChange: (filter: FilterState) => void;
};

export const UNCLASSIFIED_DECK = '__none__';

export function PhraseFilter({ categories, decks, tags, filter, onChange }: PhraseFilterProps) {
  const { t, lang } = useI18n();
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    onChange({
      ...filter,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="phrase-filter">
      <div className="filter-group">
        <input
          type="text"
          name="keyword"
          value={filter.keyword}
          onChange={handleChange}
          placeholder={t('filter.keyword')}
        />
        <select name="category" value={filter.category} onChange={handleChange}>
          <option value="">{t('filter.allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabel(cat, lang)}
            </option>
          ))}
        </select>
        <select name="importance" value={filter.importance} onChange={handleChange}>
          <option value="">{t('filter.allImportance')}</option>
          {IMPORTANCE_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`importance.${value}`)}
            </option>
          ))}
        </select>
        <select name="deck" value={filter.deck} onChange={handleChange}>
          <option value="">{t('filter.allDecks')}</option>
          <option value={UNCLASSIFIED_DECK}>{t('filter.unclassifiedDeck')}</option>
          {decks.map((deck) => (
            <option key={deck} value={deck}>
              {deck}
            </option>
          ))}
        </select>
        {tags.length > 0 && (
          <select name="tag" value={filter.tag} onChange={handleChange}>
            <option value="">{t('filter.allTags')}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            name="onlyUnanswered"
            checked={filter.onlyUnanswered}
            onChange={handleChange}
          />
          {t('filter.onlyUnanswered')}
        </label>
        <label>
          <input
            type="checkbox"
            name="onlyWeak"
            checked={filter.onlyWeak}
            onChange={handleChange}
          />
          {t('filter.onlyWeak')}
        </label>
      </div>

      <style jsx>{`
        .phrase-filter {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: var(--surface-muted);
          color: var(--foreground);
          border-radius: 8px;
        }
        .filter-group {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        input[type="text"], select {
          padding: 0.5rem;
          border: 1px solid var(--border-strong);
          border-radius: 4px;
          background: var(--surface);
          color: var(--foreground);
        }
        /* Non-color (structural) active indicator: a visible ring + thicker border. */
        input[type="text"]:focus,
        select:focus,
        input[type="text"]:focus-visible,
        select:focus-visible {
          outline: none;
          border-color: var(--primary);
          border-width: 2px;
          box-shadow: 0 0 0 3px var(--primary-soft);
        }
        label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
