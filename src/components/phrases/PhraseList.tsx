'use client';

import { Phrase } from '@/types/phrase';
import { useI18n } from '@/i18n/I18nContext';

type PhraseListProps = {
  phrases: Phrase[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PhraseList({ phrases, onEdit, onDelete }: PhraseListProps) {
  const { t } = useI18n();

  const formatDate = (
    timestamp: { seconds?: number; _seconds?: number } | null | undefined
  ) => {
    if (!timestamp) return t('list.unanswered');
    // Canonical shape is the serialized `{ seconds, nanoseconds }`; keep
    // backward-compatible handling of the legacy `_seconds` field just in case.
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (seconds === undefined) return t('list.unanswered');
    const date = new Date(seconds * 1000);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('list.confirmDelete'))) {
      onDelete(id);
    }
  };

  if (phrases.length === 0) {
    return <p className="no-phrases">{t('list.empty')}</p>;
  }

  return (
    <div className="phrase-list">
      <table>
        <thead>
          <tr>
            <th>{t('col.phrase')}</th>
            <th>{t('col.meaning')}</th>
            <th>{t('col.example')}</th>
            <th>{t('col.category')}</th>
            <th>{t('col.importance')}</th>
            <th>{t('col.accuracy')}</th>
            <th>{t('col.answeredCount')}</th>
            <th>{t('col.lastReviewed')}</th>
            <th>{t('col.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {phrases.map((phrase) => (
            <tr key={phrase.id}>
              <td data-label={t('col.phrase')}>{phrase.phrase}</td>
              <td data-label={t('col.meaning')}>{phrase.meaningJa}</td>
              <td className="example" data-label={t('col.example')}>{phrase.example ? phrase.example : '-'}</td>
              <td data-label={t('col.category')}>{phrase.category}</td>
              <td data-label={t('col.importance')}>{t(`importance.${phrase.importance}`)}</td>
              <td data-label={t('col.accuracy')}>
                {phrase.answeredCount > 0
                  ? `${Math.round(phrase.accuracy * 100)}%`
                  : '-'}
              </td>
              <td data-label={t('col.answeredCount')}>{phrase.answeredCount}</td>
              <td data-label={t('col.lastReviewed')}>{formatDate(phrase.lastReviewedAt)}</td>
              <td data-label={t('col.actions')}>
                <div className="actions">
                  <button onClick={() => onEdit(phrase.id)}>{t('action.edit')}</button>
                  <button onClick={() => handleDelete(phrase.id)} className="delete">
                    {t('action.delete')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .phrase-list {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        th, td {
          border: 1px solid #eee;
          padding: 0.75rem;
          text-align: left;
        }
        th {
          background-color: #f4f4f4;
          font-weight: bold;
        }
        tr:hover {
          background-color: #fafafa;
        }
        .example {
          color: #555;
          font-size: 0.9rem;
          max-width: 24rem;
        }
        .no-phrases {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
        .actions {
          display: flex;
          gap: 0.5rem;
        }
        button {
          padding: 0.25rem 0.5rem;
          cursor: pointer;
        }
        .delete {
          color: white;
          background-color: #ff4d4f;
          border: 1px solid #ff4d4f;
          border-radius: 4px;
        }
        .delete:hover {
          background-color: #ff7875;
        }
        /* Mobile: collapse each row into a stacked "label: value" card so the
           table never requires horizontal scrolling. Desktop is unaffected. */
        @media (max-width: 640px) {
          .phrase-list {
            overflow-x: visible;
          }
          table,
          tbody {
            display: block;
            width: 100%;
          }
          thead {
            display: none;
          }
          tr {
            display: block;
            border: 1px solid #eee;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
          td {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 0.75rem;
            border: 0;
            border-bottom: 1px solid #f4f4f4;
            padding: 0.5rem 0.25rem;
            text-align: right;
            max-width: none;
            overflow-wrap: anywhere;
          }
          tr td:last-child {
            border-bottom: 0;
          }
          td::before {
            content: attr(data-label);
            flex: 0 0 auto;
            font-weight: bold;
            color: #666;
            text-align: left;
            white-space: nowrap;
          }
          .actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
