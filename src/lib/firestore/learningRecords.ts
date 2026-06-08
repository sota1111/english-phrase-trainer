import { db } from '@/lib/firebase-admin';
import { LearningRecord, LearningRecordInput } from '@/types/learningRecord';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'learningRecords';

export async function createLearningRecord(input: LearningRecordInput): Promise<LearningRecord> {
  const data = {
    ...input,
    answeredAt: FieldValue.serverTimestamp(),
  };
  const ref = await db.collection(COLLECTION).add(data);
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() } as LearningRecord;
}
