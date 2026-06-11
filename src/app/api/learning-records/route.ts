import { NextRequest, NextResponse } from 'next/server';
import { createLearningRecord } from '@/lib/firestore/learningRecords';
import { updatePhraseStats } from '@/lib/firestore/phrases';
import { QuizType, LearningRecordInput } from '@/types/learningRecord';

type RecordRequest = {
  phraseId: string;
  quizType: QuizType;
  answer: string;
  correctAnswer: string;
};

function isCorrectAnswer(answer: string, correctAnswer: string): boolean {
  return answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body: RecordRequest = await request.json();
    const { phraseId, quizType, answer, correctAnswer } = body;
    const isCorrect = isCorrectAnswer(answer, correctAnswer);
    const record = await createLearningRecord({
      phraseId,
      quizType,
      isCorrect,
      answer,
      correctAnswer,
    } as unknown as LearningRecordInput);
    await updatePhraseStats(phraseId, isCorrect);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('POST /api/learning-records error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
