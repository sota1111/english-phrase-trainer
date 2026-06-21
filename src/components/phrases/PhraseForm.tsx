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
  onSubmit: (data: PhraseInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function PhraseForm({ initialData, categories = [], onSubmit, onCancel, isLoading }: PhraseFormProps) {
  const { t, lang } = useI18n();
  const [formData, setFormData] = useState<PhraseInput>({
    phrase: initialData?.phrase ?? '',
    meaningJa: initialData?.meaningJa ?? '',
    example: initialData?.example ?? '',
    exampleJa: initialData?.exampleJa ?? '',
    category: initialData?.category ?? '',
    importance: initialData?.importance ?? 'normal',
    memo: initialData?.memo ?? '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="phrase-form">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="phrase">{t('form.phrase')}</label>
          <input
            id="phrase"
            name="phrase"
            type="text"
            value={formData.phrase}
            onChange={handleChange}
            required
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
            required
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
            required
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
            required
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
                required
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
              required
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
            required
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
      </div>

      <div className="auto-gen-section">
        <div className="gen-buttons">
          <button
            type="button"
            onClick={() => handleGenerate('ja2en')}
            disabled={isGenerating || isLoading || !formData.meaningJa.trim()}
          >
            {t('form.genJa2En')}
          </button>
          <button
            type="button"
            onClick={() => handleGenerate('en2ja')}
            disabled={isGenerating || isLoading || !formData.phrase.trim()}
          >
            {t('form.genEn2Ja')}
          </button>
        </div>
        <p className="gen-note">
          {t('form.genNote')}
        </p>
        {genMessage && (
          <p className={`gen-message ${genMessage.type}`}>
            {genMessage.text}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading || isGenerating}>
          {t('form.cancel')}
        </button>
        <button type="submit" className="submit" disabled={isLoading || isGenerating}>
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
          padding: 0.6rem 0.75rem;
          border-radius: 4px;
          border: 1px dashed var(--border-strong);
        }
        .gen-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }
        @media (max-width: 520px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        .gen-buttons button {
          flex: 1;
          font-size: 0.8rem;
          padding: 0.4rem;
          background: var(--primary-soft);
          color: var(--primary-soft-fg);
          border-color: var(--primary-soft);
        }
        .gen-note {
          font-size: 0.75rem;
          color: var(--muted);
          margin: 0;
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
