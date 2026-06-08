import { db } from '@/lib/firebase-admin';
import { Phrase, PhraseInput } from '@/types/phrase';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'phrases';

export async function getPhrases(): Promise<Phrase[]> {
  const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Phrase));
}

export async function getPhraseById(id: string): Promise<Phrase | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Phrase;
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
  return { id: doc.id, ...doc.data() } as Phrase;
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
