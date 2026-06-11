import { db } from '@/lib/firebase-admin';
import { ReviewSchedule } from '@/types/reviewSchedule';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { DEFAULT_SM2_PARAMS } from '@/lib/sm2';

const COLLECTION = 'reviewSchedules';

export async function getReviewSchedule(phraseId: string): Promise<ReviewSchedule> {
  const doc = await db.collection(COLLECTION).doc(phraseId).get();
  if (!doc.exists) {
    return {
      phraseId,
      ...DEFAULT_SM2_PARAMS,
      dueDate: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }
  return { phraseId, ...doc.data() } as ReviewSchedule;
}

export async function getDueReviews(today: Date): Promise<ReviewSchedule[]> {
  const todayTs = Timestamp.fromDate(today);
  // Get phrases with null dueDate (never reviewed) OR dueDate <= today
  const [nullDue, pastDue] = await Promise.all([
    db.collection(COLLECTION).where('dueDate', '==', null).get(),
    db.collection(COLLECTION).where('dueDate', '<=', todayTs).get(),
  ]);
  const seen = new Set<string>();
  const results: ReviewSchedule[] = [];
  [...nullDue.docs, ...pastDue.docs].forEach(doc => {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      results.push({ phraseId: doc.id, ...doc.data() } as ReviewSchedule);
    }
  });
  return results;
}

export async function upsertReviewSchedule(
  phraseId: string,
  params: { easeFactor: number; interval: number; repetitions: number; dueDate: Date }
): Promise<void> {
  const data = {
    phraseId,
    easeFactor: params.easeFactor,
    interval: params.interval,
    repetitions: params.repetitions,
    dueDate: Timestamp.fromDate(params.dueDate),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = db.collection(COLLECTION).doc(phraseId);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.update(data);
  } else {
    await ref.set({ ...data, createdAt: FieldValue.serverTimestamp() });
  }
}

export async function countDueReviews(today: Date): Promise<number> {
  const schedules = await getDueReviews(today);
  return schedules.length;
}
