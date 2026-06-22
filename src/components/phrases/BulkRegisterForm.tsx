'use client';

import { useState } from 'react';
import { PhraseInput, Importance } from '@/types/phrase';
import { IMPORTANCE_VALUES } from '@/lib/importance';
import { useI18n } from '@/i18n/I18nContext';
import { createPhrasesAction } from '@/lib/actions/phraseActions';

type Draft = {
  phrase: string;
  meaningJa: string;
  example: string;
  exampleJa: string;
  category: string;
  importance: Importance;
  include: boolean;
};

type BulkRegisterFormProps = {
  onComplete: () => void;
  onCancel: () => void;
};

export function BulkRegisterForm({ onComplete, onCancel }: BulkRegisterFormProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsParsing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/phrases/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (response.ok) {
        const results: Draft[] = (data.results ?? []).map(
          (r: Omit<Draft, 'include'>) => ({ ...r, include: true }),
        );
        if (results.length === 0) {
          setMessage({ type: 'info', text: t('phrases.bulk.empty') });
        } else {
          setDrafts(results);
          setStep('review');
        }
      } else {
        setMessage({
          type: response.status === 503 ? 'info' : 'error',
          text: data.message || t('phrases.bulk.error'),
        });
      }
    } catch (error) {
      console.error('Bulk parse error:', error);
      setMessage({ type: 'error', text: t('phrases.bulk.commError') });
    } finally {
      setIsParsing(false);
    }
  };

  const updateDraft = (index: number, patch: Partial<Draft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const selectedCount = drafts.filter((d) => d.include && d.phrase.trim()).length;

  const handleRegister = async () => {
    const selected = drafts.filter((d) => d.include && d.phrase.trim());
    if (selected.length === 0) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const inputs: PhraseInput[] = selected.map((d) => ({
        phrase: d.phrase.trim(),
        meaningJa: d.meaningJa.trim(),
        example: d.example.trim(),
        exampleJa: d.exampleJa.trim(),
        category: d.category.trim(),
        importance: d.importance,
        memo: '',
      }));
      const count = await createPhrasesAction(inputs);
      setMessage({ type: 'info', text: t('phrases.bulk.added', { n: count }) });
      onComplete();
    } catch (error) {
      console.error('Bulk register error:', error);
      setMessage({ type: 'error', text: t('phrases.bulk.commError') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bulk-form">
      <h2>{t('phrases.bulk.title')}</h2>

      {step === 'input' ? (
        <>
          <label htmlFor="bulk-text">{t('phrases.bulk.inputLabel')}</label>
          <textarea
            id="bulk-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('phrases.bulk.placeholder')}
            rows={10}
          />
          {message && <p className={`bulk-message ${message.type}`}>{message.text}</p>}
          <div className="bulk-actions">
            <button type="button" onClick={onCancel} disabled={isParsing}>
              {t('form.cancel')}
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleParse}
              disabled={isParsing || !text.trim()}
            >
              {isParsing ? t('phrases.bulk.parsing') : t('phrases.bulk.parse')}
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>{t('phrases.bulk.reviewTitle', { n: drafts.length })}</h3>
          <p className="bulk-note">{t('phrases.bulk.reviewNote')}</p>
          <div className="draft-list">
            <div className="draft-row header">
              <span className="col-include">{t('phrases.bulk.include')}</span>
              <span>{t('phrases.bulk.colPhrase')}</span>
              <span>{t('phrases.bulk.colMeaning')}</span>
              <span>{t('phrases.bulk.colExample')}</span>
              <span>{t('phrases.bulk.colExampleJa')}</span>
              <span>{t('phrases.bulk.colCategory')}</span>
              <span>{t('phrases.bulk.colImportance')}</span>
            </div>
            {drafts.map((draft, index) => (
              <div className={`draft-row ${draft.include ? '' : 'excluded'}`} key={index}>
                <span className="col-include">
                  <input
                    type="checkbox"
                    checked={draft.include}
                    onChange={(e) => updateDraft(index, { include: e.target.checked })}
                    aria-label={t('phrases.bulk.include')}
                  />
                </span>
                <input
                  type="text"
                  value={draft.phrase}
                  onChange={(e) => updateDraft(index, { phrase: e.target.value })}
                />
                <input
                  type="text"
                  value={draft.meaningJa}
                  onChange={(e) => updateDraft(index, { meaningJa: e.target.value })}
                />
                <input
                  type="text"
                  value={draft.example}
                  onChange={(e) => updateDraft(index, { example: e.target.value })}
                  aria-label={t('phrases.bulk.colExample')}
                />
                <input
                  type="text"
                  value={draft.exampleJa}
                  onChange={(e) => updateDraft(index, { exampleJa: e.target.value })}
                  aria-label={t('phrases.bulk.colExampleJa')}
                />
                <input
                  type="text"
                  value={draft.category}
                  onChange={(e) => updateDraft(index, { category: e.target.value })}
                />
                <select
                  value={draft.importance}
                  onChange={(e) =>
                    updateDraft(index, { importance: e.target.value as Importance })
                  }
                >
                  {IMPORTANCE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {t(`importance.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {message && <p className={`bulk-message ${message.type}`}>{message.text}</p>}
          <div className="bulk-actions">
            <button type="button" onClick={() => setStep('input')} disabled={isSaving}>
              {t('phrases.bulk.back')}
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleRegister}
              disabled={isSaving || selectedCount === 0}
            >
              {isSaving
                ? t('phrases.bulk.registering')
                : t('phrases.bulk.register', { n: selectedCount })}
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .bulk-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        h2 {
          margin: 0;
          text-align: center;
        }
        h3 {
          margin: 0;
          font-size: 1rem;
        }
        label {
          font-weight: bold;
          font-size: 0.85rem;
        }
        textarea {
          width: 100%;
          padding: 0.6rem;
          border: 1px solid var(--border, #ccc);
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
        }
        .bulk-note {
          font-size: 0.8rem;
          color: var(--muted, #666);
          margin: 0;
        }
        .draft-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-height: 50vh;
          overflow-y: auto;
        }
        .draft-row {
          display: grid;
          grid-template-columns: 2.5rem 1.3fr 1.3fr 1.5fr 1.5fr 1fr 5rem;
          gap: 0.4rem;
          align-items: center;
        }
        .draft-row.header {
          font-size: 0.7rem;
          font-weight: bold;
          color: var(--muted, #666);
          position: sticky;
          top: 0;
          background: var(--surface, #fff);
        }
        .draft-row.excluded input[type='text'],
        .draft-row.excluded select {
          opacity: 0.4;
        }
        .col-include {
          text-align: center;
        }
        .draft-row input[type='text'],
        .draft-row select {
          width: 100%;
          padding: 0.3rem;
          border: 1px solid var(--border, #ccc);
          border-radius: 4px;
          font-size: 0.85rem;
          min-width: 0;
        }
        .bulk-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 0.25rem;
        }
        .bulk-message {
          font-size: 0.85rem;
          font-weight: bold;
          margin: 0;
        }
        .bulk-message.info {
          color: #0070f3;
        }
        .bulk-message.error {
          color: #e00;
        }
        button {
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid var(--border, #ccc);
          background: var(--surface, #fff);
          color: var(--foreground, #111);
          font-weight: 600;
        }
        button.primary {
          background: var(--primary, #0070f3);
          color: white;
          border-color: var(--primary, #0070f3);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 600px) {
          .draft-row {
            grid-template-columns: 2rem 1fr 1fr;
            grid-auto-rows: auto;
          }
          .draft-row.header {
            display: none;
          }
          .draft-row input[type='text'],
          .draft-row select {
            grid-column: 2 / -1;
          }
        }
      `}</style>
    </div>
  );
}
