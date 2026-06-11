import { Timestamp } from 'firebase-admin/firestore';

export interface ReviewSchedule {
  phraseId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
