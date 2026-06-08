import { Timestamp } from 'firebase-admin/firestore';

export type QuizType = 'meaning_to_phrase' | 'blank';

export interface LearningRecord {
  id: string;
  phraseId: string;
  isCorrect: boolean;
  answer: string;
  correctAnswer: string;
  quizType: QuizType;
  answeredAt: Timestamp;
}

export type LearningRecordInput = Omit<LearningRecord, 'id'>;
