export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * Importance (重要度) is a SEPARATE axis from `Difficulty`: how worth studying a
 * phrase is, independent of how hard it is. Used to classify existing phrases and
 * to narrow the spaced-review (出題) target to a chosen importance level.
 */
export type Importance = 'high' | 'normal' | 'low';

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
  importance: Importance;
  correctCount: number;
  wrongCount: number;
  answeredCount: number;
  accuracy: number;
  lastReviewedAt: SerializedTimestamp | null;
  createdAt: SerializedTimestamp | null;
  updatedAt: SerializedTimestamp | null;
}

// `importance` is optional on write input: callers that omit it (e.g. legacy seed
// datasets) are stored without the field and read back as the default 'normal'.
// On the serialized `Phrase` it is always present.
export type PhraseInput = Omit<
  Phrase,
  'id' | 'correctCount' | 'wrongCount' | 'answeredCount' | 'accuracy' | 'lastReviewedAt' | 'createdAt' | 'updatedAt' | 'importance'
> & { importance?: Importance };
