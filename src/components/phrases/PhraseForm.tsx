'use client';

import { useState } from 'react';
import { PhraseInput } from '@/types/phrase';
import { IMPORTANCE_VALUES } from '@/lib/importance';
import { useI18n } from '@/i18n/I18nContext';
import { categoryLabel } from '@/i18n/categoryLabels';

const NEW_CATEGORY_OPTION = '__new__';

// Treat the entry as Japanese when it contains any hiragana / katakana / kanji.
const isJapanese = (text: string) => /[぀-ヿ㐀-鿿ｦ-ﾟ]/.test(text);

type PhraseFormProps = {
  mode?: 'create' | 'edit';
  initialData?: Partial<PhraseInput>;
  categories?: string[];
  decks?: string[];
  onSubmit: (data: PhraseInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function PhraseForm({
  mode = 'create',
  initialData,
  categories = [],
  decks = [],
  onSubmit,
  onCancel,
  isLoading,
}: PhraseFormProps) {
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

  // Two-phase flow for new phrases: 'input' (single combined entry → AIで解析)
  // then 'review' (editable fields → キャンセル / 保存). Editing an existing
  // phrase skips straight to the editable review.
  const [phase, setPhase] = useState<'input' | 'review'>(mode === 'edit' ? 'review' : 'input');
  // Single combined input ("フレーズ（英語または日本語）") used in the input phase.
  const [entry, setEntry] = useState('');
  // Example fields are optional: hidden until requested (or when already filled).
  const [showExample, setShowExample] = useState(
    Boolean(initialData?.example || initialData?.exampleJa)
  );

  // Category options: existing categories plus the current value (when the AI
  // suggested a new category or when editing a phrase whose category is gone).
  const categoryOptions = (() => {
    const set = new Set(categories);
    if (initialData?.category) set.add(initialData.category);
    if (formData.category) set.add(formData.category);
    return Array.from(set).sort();
  })();

  // Start in free-text mode only when there are no categories to choose from.
  const [isNewCategory, setIsNewCategory] = useState(categoryOptions.length === 0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  // True when the entry is empty on AIで解析, or neither field is filled on save.
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

  // AIで解析: take the single entry, detect language, ask the AI to fill the
  // remaining fields, then reveal the editable review. On failure we still move
  // to review so the user can complete the entry manually.
  const handleAnalyze = async () => {
    const text = entry.trim();
    if (!text) {
      setInputError(true);
      return;
    }
    setInputError(false);
    const ja = isJapanese(text);
    setFormData((prev) => ({
      ...prev,
      phrase: ja ? prev.phrase : text,
      meaningJa: ja ? text : prev.meaningJa,
    }));
    setIsAnalyzing(true);
    setAnalyzeMessage(null);

    try {
      const response = await fetch('/api/phrases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: ja ? 'ja2en' : 'en2ja', text }),
      });
      const data = await response.json();

      if (response.ok) {
        const r = (data.result ?? {}) as Partial<PhraseInput>;
        setFormData((prev) => ({
          ...prev,
          phrase: (r.phrase ?? '').trim() || (ja ? prev.phrase : text),
          meaningJa: (r.meaningJa ?? '').trim() || (ja ? text : prev.meaningJa),
          example: prev.example.trim() ? prev.example : (r.example ?? ''),
          exampleJa: prev.exampleJa.trim() ? prev.exampleJa : (r.exampleJa ?? ''),
          category: prev.category.trim() ? prev.category : (r.category ?? ''),
        }));
        if (r.example || r.exampleJa) setShowExample(true);
        setAnalyzeMessage({ type: 'info', text: t('form.genSuccess') });
      } else {
        setAnalyzeMessage({
          type: response.status === 503 ? 'info' : 'error',
          text: data.message || t('form.analyzeFail'),
        });
      }
    } catch (error) {
      console.error('Analyze error:', error);
      setAnalyzeMessage({ type: 'error', text: t('form.genCommError') });
    } finally {
      setIsAnalyzing(false);
      setPhase('review');
    }
  };

  const handleSave = () => {
    // At least one of Japanese / English must be entered.
    if (!formData.phrase.trim() && !formData.meaningJa.trim()) {
      setInputError(true);
      return;
    }
    setInputError(false);
    onSubmit(formData);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'input') {
      void handleAnalyze();
    } else {
      handleSave();
    }
  };

  const exampleFields = (
    <>
      <div className="form-field form-field-full">
        <label htmlFor="example">{t('form.exampleEn')}</label>
        <input
          id="example"
          name="example"
          type="text"
          value={formData.example}
          onChange={handleChange}
        />
      </div>
      <div className="form-field form-field-full">
        <label htmlFor="exampleJa">{t('form.exampleJa')}</label>
        <input
          id="exampleJa"
          name="exampleJa"
          type="text"
          value={formData.exampleJa}
          onChange={handleChange}
        />
      </div>
    </>
  );

  return (
    <form onSubmit={handleFormSubmit} className="phrase-form">
      {phase === 'input' ? (
        <>
          <p className={`form-instruction${inputError ? ' error' : ''}`} role="note">
            {t('form.entryHint')}
          </p>
          <div className="form-grid">
            <div className="form-field form-field-full">
              <label htmlFor="entry">{t('form.entry')}</label>
              <input
                id="entry"
                name="entry"
                type="text"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                autoFocus
              />
            </div>
            {showExample ? (
              exampleFields
            ) : (
              <div className="form-field form-field-full">
                <button
                  type="button"
                  className="optional-toggle"
                  onClick={() => setShowExample(true)}
                >
                  ＋ {t('form.addExample')}
                </button>
              </div>
            )}
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
          {analyzeMessage && (
            <p className={`gen-message ${analyzeMessage.type}`}>{analyzeMessage.text}</p>
          )}
          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={isAnalyzing}>
              {t('form.cancel')}
            </button>
            <button type="submit" className="submit" disabled={isAnalyzing}>
              {isAnalyzing ? t('form.analyzing') : t('form.analyze')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={`form-instruction${inputError ? ' error' : ''}`} role="note">
            {inputError ? t('form.inputHint') : t('form.reviewHint')}
          </p>
          {analyzeMessage && (
            <p className={`gen-message ${analyzeMessage.type}`}>{analyzeMessage.text}</p>
          )}
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
            {showExample ? (
              exampleFields
            ) : (
              <div className="form-field form-field-full">
                <button
                  type="button"
                  className="optional-toggle"
                  onClick={() => setShowExample(true)}
                >
                  ＋ {t('form.addExample')}
                </button>
              </div>
            )}
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
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={isLoading}>
              {t('form.cancel')}
            </button>
            <button type="submit" className="submit" disabled={isLoading}>
              {isLoading ? t('form.saving') : t('form.save')}
            </button>
          </div>
        </>
      )}

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
        .optional-toggle {
          align-self: flex-start;
          font-size: 0.85rem;
          font-weight: bold;
          color: var(--primary);
          background: none;
          border: 1px dashed var(--border-strong);
          padding: 0.4rem 0.75rem;
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
        @media (max-width: 520px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        .gen-message {
          font-size: 0.8rem;
          margin: 0;
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
