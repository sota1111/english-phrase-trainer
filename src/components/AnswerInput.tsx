'use client';

import React, { useState } from 'react';

type AnswerInputProps = {
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
  placeholder?: string;
};

export default function AnswerInput({ onSubmit, isLoading, placeholder = "答えを入力..." }: AnswerInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        autoFocus
      />
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? '送信中...' : '回答する'}
      </button>
    </form>
  );
}
