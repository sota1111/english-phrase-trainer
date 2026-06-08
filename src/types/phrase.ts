import { Timestamp } from 'firebase-admin/firestore';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Phrase {
  id: string;
  phrase: string;
  meaningJa: string;
  example: string;
  exampleJa: string;
  category: string;
  memo: string;
  difficulty: Difficulty;
  correctCount: number;
  wrongCount: number;
  answeredCount: number;
  accuracy: number;
  lastReviewedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PhraseInput = Omit<Phrase, 'id' | 'correctCount' | 'wrongCount' | 'answeredCount' | 'accuracy' | 'lastReviewedAt' | 'createdAt' | 'updatedAt'>;
