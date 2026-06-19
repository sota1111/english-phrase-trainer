export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * Plain, serializable representation of a Firestore Timestamp.
 * Server Actions must only return plain objects across the server -> client
 * boundary; returning a Firestore `Timestamp` class instance throws under
 * Next.js / React 19. Firestore timestamps are normalized to this shape in the
 * data layer (see `serializePhrase`).
 */
export interface SerializedTimestamp {
  seconds: number;
  nanoseconds: number;
}

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
  lastReviewedAt: SerializedTimestamp | null;
  createdAt: SerializedTimestamp | null;
  updatedAt: SerializedTimestamp | null;
}

export type PhraseInput = Omit<Phrase, 'id' | 'correctCount' | 'wrongCount' | 'answeredCount' | 'accuracy' | 'lastReviewedAt' | 'createdAt' | 'updatedAt'>;
