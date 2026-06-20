import { db } from '@/lib/firebase-admin';
import { Phrase, PhraseInput, SerializedTimestamp } from '@/types/phrase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const COLLECTION = 'phrases';

/**
 * Convert a Firestore Timestamp (or already-plain value) into a plain,
 * serializable `{ seconds, nanoseconds }` object. Returns null for missing
 * values. This keeps Server Action return values serializable across the
 * server -> client boundary.
 */
function toSerializedTimestamp(value: unknown): SerializedTimestamp | null {
  if (!value) return null;
  if (value instanceof Timestamp) {
    return { seconds: value.seconds, nanoseconds: value.nanoseconds };
  }
  const candidate = value as { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
  const seconds = candidate.seconds ?? candidate._seconds;
  if (typeof seconds === 'number') {
    return { seconds, nanoseconds: candidate.nanoseconds ?? candidate._nanoseconds ?? 0 };
  }
  return null;
}

/**
 * Map a raw Firestore document into a plain, serializable `Phrase`.
 */
function serializePhrase(id: string, data: FirebaseFirestore.DocumentData): Phrase {
  return {
    id,
    phrase: data.phrase ?? '',
    meaningJa: data.meaningJa ?? '',
    example: data.example ?? '',
    exampleJa: data.exampleJa ?? '',
    category: data.category ?? '',
    memo: data.memo ?? '',
    // Legacy phrases predate the importance field; default them to 'normal' so
    // they stay classified with no data migration.
    importance: data.importance ?? 'normal',
    correctCount: data.correctCount ?? 0,
    wrongCount: data.wrongCount ?? 0,
    answeredCount: data.answeredCount ?? 0,
    accuracy: data.accuracy ?? 0,
    lastReviewedAt: toSerializedTimestamp(data.lastReviewedAt),
    createdAt: toSerializedTimestamp(data.createdAt),
    updatedAt: toSerializedTimestamp(data.updatedAt),
  };
}

export async function getPhrases(): Promise<Phrase[]> {
  const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => serializePhrase(doc.id, doc.data()));
}

export async function getPhraseById(id: string): Promise<Phrase | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return serializePhrase(doc.id, doc.data()!);
}

export async function createPhrase(input: PhraseInput): Promise<Phrase> {
  const data = {
    ...input,
    correctCount: 0,
    wrongCount: 0,
    answeredCount: 0,
    accuracy: 0,
    lastReviewedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await db.collection(COLLECTION).add(data);
  const doc = await ref.get();
  return serializePhrase(doc.id, doc.data()!);
}

export async function updatePhrase(id: string, input: Partial<PhraseInput>): Promise<void> {
  await db.collection(COLLECTION).doc(id).update({
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deletePhrase(id: string): Promise<void> {
  await db.collection(COLLECTION).doc(id).delete();
}

export async function updatePhraseStats(
  id: string,
  isCorrect: boolean
): Promise<void> {
  const ref = db.collection(COLLECTION).doc(id);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error(`Phrase ${id} not found`);
    const data = doc.data()!;
    const correctCount = (data.correctCount || 0) + (isCorrect ? 1 : 0);
    const wrongCount = (data.wrongCount || 0) + (isCorrect ? 0 : 1);
    const answeredCount = correctCount + wrongCount;
    const accuracy = answeredCount > 0 ? correctCount / answeredCount : 0;
    tx.update(ref, {
      correctCount,
      wrongCount,
      answeredCount,
      accuracy,
      lastReviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
