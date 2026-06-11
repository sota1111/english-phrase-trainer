import { Timestamp } from 'firebase-admin/firestore';

export interface DailyStat {
  date: string;         // "YYYY-MM-DD"
  reviewCount: number;
  correctCount: number;
  phraseIds: string[];  // phrase IDs reviewed (may contain duplicates)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
