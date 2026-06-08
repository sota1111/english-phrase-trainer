'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'all' | 'unanswered' | 'weak' | 'category' | 'difficulty';

export function ReviewSetupClient({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('all');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('normal');
  const [limit, setLimit] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      mode,
      limit: limit.toString(),
    });
    if (mode === 'category' && category) params.append('category', category);
    if (mode === 'difficulty' && difficulty) params.append('difficulty', difficulty);
    
    router.push(`/review/session?${params.toString()}`);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">復習クイズ設定</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">出題モード</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'all', label: '全フレーズ' },
              { id: 'unanswered', label: '未回答のみ' },
              { id: 'weak', label: '苦手フレーズ' },
              { id: 'category', label: 'カテゴリ別' },
              { id: 'difficulty', label: '難易度別' },
            ].map((m) => (
              <label key={m.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${mode === m.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="mode"
                  value={m.id}
                  checked={mode === m.id}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {mode === 'category' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選択してください</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {mode === 'difficulty' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">難易度</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">出題数 (1-50)</label>
          <input
            type="number"
            min="1"
            max="50"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          クイズを開始
        </button>
      </form>
    </div>
  );
}
