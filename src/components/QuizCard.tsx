'use client';

import { Phrase } from '@/types/phrase';
import { QuizType } from '@/types/learningRecord';

export type QuizCardProps = {
  phrase: Phrase;
  quizType: QuizType;
  questionNumber: number;
  totalQuestions: number;
};

export default function QuizCard({ phrase, quizType, questionNumber, totalQuestions }: QuizCardProps) {
  const renderQuestion = () => {
    if (quizType === 'meaning_to_phrase') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">次の意味の英語フレーズを入力してください</p>
          <p className="text-2xl font-bold">{phrase.meaningJa}</p>
        </div>
      );
    } else {
      // blank type
      const blankExample = phrase.example.replace(
        new RegExp(phrase.phrase, 'gi'),
        '___'
      );
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">空欄に入る英語フレーズを入力してください</p>
          <p className="text-xl italic font-medium">&quot;{blankExample}&quot;</p>
          <p className="text-sm text-gray-600">({phrase.exampleJa})</p>
        </div>
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
          問 {questionNumber} / {totalQuestions}
        </span>
        <span className="text-xs text-gray-400 capitalize">{phrase.category}</span>
      </div>
      {renderQuestion()}
    </div>
  );
}
