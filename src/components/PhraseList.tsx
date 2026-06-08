'use client';

import { Phrase } from '@/types/phrase';

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

  const formatDate = (timestamp: { toDate?: () => Date; _seconds?: number } | null | undefined) => {
    if (!timestamp) return '未回答';
    // Handle both Firestore Timestamp and serialized version
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp._seconds !== undefined) {
      date = new Date(timestamp._seconds * 1000);
    } else {
      date = new Date(timestamp as unknown as string | number);
    }
    
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
            <th>カテゴリ</th>
            <th>難易度</th>
            <th>正答率</th>
            <th>回答回数</th>
            <th>最終復習日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {phrases.map((phrase) => (
            <tr key={phrase.id}>
              <td>{phrase.phrase}</td>
              <td>{phrase.meaningJa}</td>
              <td>{phrase.category}</td>
              <td>{DIFFICULTY_MAP[phrase.difficulty]}</td>
              <td>
                {phrase.answeredCount > 0
                  ? `${Math.round(phrase.accuracy * 100)}%`
                  : '-'}
              </td>
              <td>{phrase.answeredCount}</td>
              <td>{formatDate(phrase.lastReviewedAt)}</td>
              <td>
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
      `}</style>
    </div>
  );
}
