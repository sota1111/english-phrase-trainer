'use client';

import { useState } from 'react';
import { PhraseInput } from '@/types/phrase';
import { IMPORTANCE_VALUES } from '@/lib/importance';
import { useI18n } from '@/i18n/I18nContext';
import { categoryLabel } from '@/i18n/categoryLabels';

const NEW_CATEGORY_OPTION = '__new__';

type PhraseFormProps = {
  initialData?: Partial<PhraseInput>;
  categories?: string[];
  decks?: string[];
  onSubmit: (data: PhraseInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function PhraseForm({ initialData, categories = [], decks = [], onSubmit, onCancel, isLoading }: PhraseFormProps) {
  const { t, lang } = useI18n();
  const [formData, setFormData] = useState<PhraseInput>({
    phrase: initialData?.phrase ?? '',
    meaningJa: initialData?.meaningJa ?? '',
    example: initialData?.example ?? '',
    exampleJa: initialData?.exampleJa ?? '',
    category: initialData?.category ?? '',
    importance: initialData?.importance ?? 'normal',
    memo: initialData?.memo ?? '',
    synonyms: initialData?.synonyms ?? [],
    collocations: initialData?.collocations ?? [],
    deck: initialData?.deck ?? '',
    tags: initialData?.tags ?? [],
  });

  // Category options: existing categories plus the current value (when editing a
  // phrase whose category is no longer in the list).
  const categoryOptions = (() => {
    const set = new Set(categories);
    if (initialData?.category) set.add(initialData.category);
    return Array.from(set).sort();
  })();

  // Start in free-text mode only when there are no categories to choose from.
  const [isNewCategory, setIsNewCategory] = useState(categoryOptions.length === 0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  // True when neither Japanese nor English was entered on submit. Drives the
  // top instruction line into an error style — the only validation message shown.
  const [inputError, setInputError] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === NEW_CATEGORY_OPTION) {
      setIsNewCategory(true);
      setFormData((prev) => ({ ...prev, category: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleGenerate = async (mode: 'ja2en' | 'en2ja') => {
    const text = mode === 'ja2en' ? formData.meaningJa : formData.phrase;
    if (!text.trim()) return;

    setIsGenerating(true);
    setGenMessage(null);

    try {
      const response = await fetch('/api/phrases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          ...data.result,
        }));
        setGenMessage({ type: 'info', text: t('form.genSuccess') });
      } else {
        setGenMessage({
          type: response.status === 503 ? 'info' : 'error',
          text: data.message || t('form.genFail')
        });
      }
    } catch (error) {
      console.error('Generate error:', error);
      setGenMessage({ type: 'error', text: t('form.genCommError') });
    } finally {
      setIsGenerating(false);
    }
  };

  // Comma-separated <-> string[] binding for the synonyms / collocations inputs.
  const handleListChange = (
    field: 'synonyms' | 'collocations' | 'tags',
    value: string
  ) => {
    const list = value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setFormData((prev) => ({ ...prev, [field]: list }));
  };

  const handleEnrich = async () => {
    if (!formData.phrase.trim()) return;
    setIsEnriching(true);
    setEnrichMessage(null);

    try {
      const response = await fetch('/api/phrases/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: formData.phrase, meaningJa: formData.meaningJa }),
      });
      const data = await response.json();

      if (response.ok) {
        const { synonyms = [], collocations = [], examples = [] } = data.result ?? {};
        setFormData((prev) => ({
          ...prev,
          synonyms,
          collocations,
          // Only fill the example when the user has not entered one yet.
          example: prev.example.trim() ? prev.example : (examples[0] ?? prev.example),
        }));
        setEnrichMessage({ type: 'info', text: t('form.enrichSuccess') });
      } else {
        setEnrichMessage({
          type: response.status === 503 ? 'info' : 'error',
          text: data.message || t('form.enrichFail'),
        });
      }
    } catch (error) {
      console.error('Enrich error:', error);
      setEnrichMessage({ type: 'error', text: t('form.genCommError') });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // At least one of Japanese / English must be entered; the rest can be
    // auto-generated. Show only the single top instruction message otherwise.
    if (!formData.phrase.trim() && !formData.meaningJa.trim()) {
      setInputError(true);
      return;
    }
    setInputError(false);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="phrase-form">
      <p className={`form-instruction${inputError ? ' error' : ''}`} role="note">
        {t('form.inputHint')}
      </p>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="phrase">{t('form.phrase')}</label>
          <input
            id="phrase"
            name="phrase"
            type="text"
            value={formData.phrase}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="meaningJa">{t('form.meaning')}</label>
          <input
            id="meaningJa"
            name="meaningJa"
            type="text"
            value={formData.meaningJa}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="example">{t('form.exampleEn')}</label>
          <input
            id="example"
            name="example"
            type="text"
            value={formData.example}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="exampleJa">{t('form.exampleJa')}</label>
          <input
            id="exampleJa"
            name="exampleJa"
            type="text"
            value={formData.exampleJa}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="category">{t('form.category')}</label>
          {isNewCategory ? (
            <div className="category-new">
              <input
                id="category"
                name="category"
                type="text"
                value={formData.category}
                onChange={handleChange}
                placeholder={t('form.newCategoryPlaceholder')}
              />
              {categoryOptions.length > 0 && (
                <button
                  type="button"
                  className="category-toggle"
                  onClick={() => {
                    setIsNewCategory(false);
                    setFormData((prev) => ({ ...prev, category: categoryOptions[0] }));
                  }}
                >
                  {t('form.selectFromList')}
                </button>
              )}
            </div>
          ) : (
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleCategorySelect}
            >
              <option value="" disabled>
                {t('form.selectPlaceholder')}
              </option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabel(cat, lang)}
                </option>
              ))}
              <option value={NEW_CATEGORY_OPTION}>{t('form.addNewCategory')}</option>
            </select>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="importance">{t('form.importance')}</label>
          <select
            id="importance"
            name="importance"
            value={formData.importance ?? 'normal'}
            onChange={handleChange}
          >
            {IMPORTANCE_VALUES.map((value) => (
              <option key={value} value={value}>
                {t(`importance.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field form-field-full">
          <label htmlFor="memo">{t('form.memo')}</label>
          <textarea
            id="memo"
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div className="form-field form-field-full">
          <label htmlFor="synonyms">{t('form.synonyms')}</label>
          <input
            id="synonyms"
            name="synonyms"
            type="text"
            value={(formData.synonyms ?? []).join(', ')}
            onChange={(e) => handleListChange('synonyms', e.target.value)}
            placeholder={t('form.listPlaceholder')}
          />
        </div>
        <div className="form-field form-field-full">
          <label htmlFor="collocations">{t('form.collocations')}</label>
          <input
            id="collocations"
            name="collocations"
            type="text"
            value={(formData.collocations ?? []).join(', ')}
            onChange={(e) => handleListChange('collocations', e.target.value)}
            placeholder={t('form.listPlaceholder')}
          />
        </div>
        <div className="form-field">
          <label htmlFor="deck">{t('form.deck')}</label>
          <input
            id="deck"
            name="deck"
            type="text"
            value={formData.deck ?? ''}
            onChange={handleChange}
            placeholder={t('form.deckPlaceholder')}
            list="deck-options"
          />
          {decks.length > 0 && (
            <datalist id="deck-options">
              {decks.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="tags">{t('form.tags')}</label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={(formData.tags ?? []).join(', ')}
            onChange={(e) => handleListChange('tags', e.target.value)}
            placeholder={t('form.listPlaceholder')}
          />
        </div>
      </div>

      <div className="auto-gen-section">
        <p className="ai-section-title">{t('form.aiSectionTitle')}</p>
        <div className="gen-buttons">
          <button
            type="button"
            onClick={() => handleGenerate('en2ja')}
            disabled={isGenerating || isLoading || !formData.phrase.trim()}
          >
            {t('form.genEn2Ja')}
          </button>
          <button
            type="button"
            onClick={() => handleGenerate('ja2en')}
            disabled={isGenerating || isLoading || !formData.meaningJa.trim()}
          >
            {t('form.genJa2En')}
          </button>
        </div>
        {genMessage && (
          <p className={`gen-message ${genMessage.type}`}>
            {genMessage.text}
          </p>
        )}
        <div className="gen-buttons enrich-row">
          <button
            type="button"
            onClick={handleEnrich}
            disabled={isEnriching || isGenerating || isLoading || !formData.phrase.trim()}
          >
            {isEnriching ? t('form.enriching') : t('form.enrich')}
          </button>
        </div>
        {enrichMessage && (
          <p className={`gen-message ${enrichMessage.type}`}>
            {enrichMessage.text}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading || isGenerating || isEnriching}>
          {t('form.cancel')}
        </button>
        <button type="submit" className="submit" disabled={isLoading || isGenerating || isEnriching}>
          {isLoading ? t('form.saving') : t('form.save')}
        </button>
      </div>

      <style jsx>{`
        .phrase-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 640px;
          margin: 0 auto;
          background: var(--surface);
          color: var(--foreground);
          padding: 1rem 1.25rem;
          border-radius: 8px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem 1rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-field-full {
          grid-column: 1 / -1;
        }
        label {
          font-weight: bold;
          font-size: 0.8rem;
        }
        /* Single input guidance / validation message, shown at the top of the
           form with a clearly visible (non-muted) color. */
        .form-instruction {
          margin: 0;
          font-size: 0.85rem;
          font-weight: bold;
          color: var(--foreground);
        }
        .form-instruction.error {
          color: #e00;
        }
        input, select, textarea {
          padding: 0.4rem;
          border: 1px solid var(--border-strong);
          border-radius: 4px;
          font-size: 0.95rem;
          background: var(--surface);
          color: var(--foreground);
        }
        /* Non-color (structural) active indicator: a visible ring + thicker border
           so the focused/active field is identifiable even when color is hard to see. */
        input:focus,
        select:focus,
        textarea:focus,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: none;
          border-color: var(--primary);
          border-width: 2px;
          box-shadow: 0 0 0 3px var(--primary-soft);
        }
        .category-new {
          display: flex;
          gap: 0.4rem;
          align-items: center;
        }
        .category-new input {
          flex: 1;
        }
        .category-toggle {
          flex-shrink: 0;
          font-size: 0.7rem;
          padding: 0.3rem 0.5rem;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 0.25rem;
        }
        .auto-gen-section {
          background: var(--surface-muted);
          padding: 0.75rem 0.85rem;
          border-radius: 8px;
          border: 2px solid var(--primary);
        }
        .ai-section-title {
          margin: 0 0 0.5rem;
          font-size: 0.9rem;
          font-weight: bold;
          color: var(--primary);
        }
        .gen-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .enrich-row {
          margin-bottom: 0;
        }
        @media (max-width: 520px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        .gen-buttons button {
          flex: 1;
          font-size: 0.9rem;
          font-weight: bold;
          padding: 0.55rem 0.5rem;
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
        .gen-buttons button:not(:disabled):hover {
          filter: brightness(0.95);
        }
        .gen-message {
          font-size: 0.8rem;
          margin-top: 0.5rem;
          font-weight: bold;
        }
        .gen-message.info {
          color: #0070f3;
        }
        .gen-message.error {
          color: #e00;
        }
        button {
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid var(--border-strong);
          background: var(--surface);
          color: var(--foreground);
        }
        button.submit {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
