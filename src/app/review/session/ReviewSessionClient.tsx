'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phrase } from '@/types/phrase';
import { QuizType } from '@/types/learningRecord';
import QuizCard from '@/components/QuizCard';
import AnswerInput from '@/components/AnswerInput';

type ReviewSessionClientProps = {
  initialPhrases: Phrase[];
};

export function ReviewSessionClient({ initialPhrases }: ReviewSessionClientProps) {
  const [phrases] = useState<Phrase[]>(initialPhrases);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizTypes] = useState<QuizType[]>(() =>
    initialPhrases.map(() => (Math.random() < 0.5 ? 'meaning_to_phrase' : 'blank') as QuizType)
  );
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  if (phrases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600 mb-6">対象フレーズがありません</p>
        <Link href="/review" className="text-blue-600 hover:underline">
          設定に戻る
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">お疲れ様でした！</h2>
        <div className="text-5xl font-extrabold text-blue-600 mb-6">
          {score.correct} / {score.total} <span className="text-2xl text-gray-400">問正解</span>
        </div>
        <p className="text-gray-600 mb-8">
          正答率: {Math.round((score.correct / score.total) * 100)}%
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/review"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            もう一度挑戦する
          </Link>
          <Link
            href="/phrases"
            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
          >
            フレーズ一覧へ
          </Link>
        </div>
      </div>
    );
  }

  const currentPhrase = phrases[currentIndex];
  const currentQuizType = quizTypes[currentIndex];

  const handleAnswerSubmit = async (answer: string) => {
    setIsLoading(true);
    const correctAnswer = currentPhrase.phrase;
    
    try {
      const response = await fetch('/api/learning-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phraseId: currentPhrase.id,
          quizType: currentQuizType,
          answer,
          correctAnswer,
        }),
      });

      if (response.ok) {
        const record = await response.json();
        setLastResult({ isCorrect: record.isCorrect, correctAnswer });
        setScore((prev) => ({
          correct: prev.correct + (record.isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));
        setShowResult(true);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setLastResult(null);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="space-y-6">
      {currentQuizType && (
        <QuizCard
          phrase={currentPhrase}
          quizType={currentQuizType}
          questionNumber={currentIndex + 1}
          totalQuestions={phrases.length}
        />
      )}

      {!showResult ? (
        <AnswerInput onSubmit={handleAnswerSubmit} isLoading={isLoading} />
      ) : (
        <div className={`p-6 rounded-lg border-2 ${lastResult?.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-2xl ${lastResult?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {lastResult?.isCorrect ? '✓ 正解！' : '✗ 不正解...'}
            </span>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">正解:</p>
            <p className="text-xl font-bold text-gray-800">{lastResult?.correctAnswer}</p>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition-colors"
          >
            {currentIndex < phrases.length - 1 ? '次へ' : '結果を見る'}
          </button>
        </div>
      )}
    </div>
  );
}
