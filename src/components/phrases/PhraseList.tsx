'use client';

import { Phrase } from '@/types/phrase';
import { IMPORTANCE_SHORT } from '@/lib/importance';

type PhraseListProps = {
  phrases: Phrase[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const DIFFICULTY_MAP = {
  easy: '易',
  normal: '普',
  hard: '難',
};

export function PhraseList({ phrases, onEdit, onDelete }: PhraseListProps) {
  if (phrases.length === 0) {
    return <p className="no-phrases">フレーズがありません</p>;
  }

  const formatDate = (
    timestamp: { seconds?: number; _seconds?: number } | null | undefined
  ) => {
    if (!timestamp) return '未回答';
    // Canonical shape is the serialized `{ seconds, nanoseconds }`; keep
    // backward-compatible handling of the legacy `_seconds` field just in case.
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (seconds === undefined) return '未回答';
    const date = new Date(seconds * 1000);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  };

  const handleDelete = (id: string) => {
    if (window.confirm('このフレーズを削除しますか？')) {
      onDelete(id);
    }
  };

  return (
    <div className="phrase-list">
      <table>
        <thead>
          <tr>
            <th>フレーズ</th>
            <th>意味</th>
            <th>例文</th>
            <th>カテゴリ</th>
            <th>難易度</th>
            <th>重要度</th>
            <th>正答率</th>
            <th>回答回数</th>
            <th>最終復習日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {phrases.map((phrase) => (
            <tr key={phrase.id}>
              <td data-label="フレーズ">{phrase.phrase}</td>
              <td data-label="意味">{phrase.meaningJa}</td>
              <td className="example" data-label="例文">{phrase.example ? phrase.example : '-'}</td>
              <td data-label="カテゴリ">{phrase.category}</td>
              <td data-label="難易度">{DIFFICULTY_MAP[phrase.difficulty]}</td>
              <td data-label="重要度">{IMPORTANCE_SHORT[phrase.importance]}</td>
              <td data-label="正答率">
                {phrase.answeredCount > 0
                  ? `${Math.round(phrase.accuracy * 100)}%`
                  : '-'}
              </td>
              <td data-label="回答回数">{phrase.answeredCount}</td>
              <td data-label="最終復習日">{formatDate(phrase.lastReviewedAt)}</td>
              <td data-label="操作">
                <div className="actions">
                  <button onClick={() => onEdit(phrase.id)}>編集</button>
                  <button onClick={() => handleDelete(phrase.id)} className="delete">
                    削除
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
