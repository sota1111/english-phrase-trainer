'use client';

import { Importance } from '@/types/phrase';
import { IMPORTANCE_VALUES, IMPORTANCE_LABEL } from '@/lib/importance';

export type FilterState = {
  keyword: string;
  category: string;
  importance: '' | Importance;
  onlyUnanswered: boolean;
  onlyWeak: boolean;
};

type PhraseFilterProps = {
  categories: string[];
  filter: FilterState;
  onChange: (filter: FilterState) => void;
};

export function PhraseFilter({ categories, filter, onChange }: PhraseFilterProps) {
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
          placeholder="キーワード検索"
        />
        <select name="category" value={filter.category} onChange={handleChange}>
          <option value="">すべてのカテゴリ</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select name="importance" value={filter.importance} onChange={handleChange}>
          <option value="">すべての重要度</option>
          {IMPORTANCE_VALUES.map((value) => (
            <option key={value} value={value}>
              {IMPORTANCE_LABEL[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            name="onlyUnanswered"
            checked={filter.onlyUnanswered}
            onChange={handleChange}
          />
          未回答のみ
        </label>
        <label>
          <input
            type="checkbox"
            name="onlyWeak"
            checked={filter.onlyWeak}
            onChange={handleChange}
          />
          苦手フレーズのみ（正答率50%未満）
        </label>
      </div>

      <style jsx>{`
        .phrase-filter {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f9f9f9;
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
          border: 1px solid #ccc;
          border-radius: 4px;
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
