import { db } from '@/lib/firebase-admin';
import { DailyStat } from '@/types/dailyStat';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'dailyStats';

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDailyStat(date: Date): Promise<DailyStat | null> {
  const dateStr = toDateString(date);
  const doc = await db.collection(COLLECTION).doc(dateStr).get();
  if (!doc.exists) return null;
  return { date: dateStr, ...doc.data() } as DailyStat;
}

export async function incrementDailyStat(
  date: Date,
  isCorrect: boolean,
  phraseId: string
): Promise<void> {
  const dateStr = toDateString(date);
  const ref = db.collection(COLLECTION).doc(dateStr);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.update({
      reviewCount: FieldValue.increment(1),
      correctCount: FieldValue.increment(isCorrect ? 1 : 0),
      phraseIds: FieldValue.arrayUnion(phraseId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set({
      date: dateStr,
      reviewCount: 1,
      correctCount: isCorrect ? 1 : 0,
      phraseIds: [phraseId],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

export async function getMonthlyStats(year: number, month: number): Promise<DailyStat[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  const snapshot = await db.collection(COLLECTION)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get();
  return snapshot.docs.map(doc => ({ date: doc.id, ...doc.data() } as DailyStat));
}

export async function getStreakDays(): Promise<number> {
  // Count consecutive days ending today (or yesterday) with at least 1 review
  const snapshot = await db.collection(COLLECTION)
    .orderBy('date', 'desc')
    .limit(365)
    .get();
  const dates = new Set(snapshot.docs.map(doc => doc.id));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toDateString(d);
    if (dates.has(dateStr)) {
      streak++;
    } else {
      // If today has no records, we check yesterday. 
      // If we are at i=0 (today) and no record, we continue to check yesterday.
      // If we are at i > 0 and no record, we break.
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

/**
 * Most recent `days` daily-stat docs, ascending by date (oldest first). Used by
 * the analytics dashboard (提案4) to draw the recent learning trend.
 */
export async function getRecentDailyStats(days: number): Promise<DailyStat[]> {
  const snapshot = await db.collection(COLLECTION)
    .orderBy('date', 'desc')
    .limit(days)
    .get();
  return snapshot.docs
    .map(doc => ({ date: doc.id, ...doc.data() } as DailyStat))
    .reverse();
}

export async function getTotalReviewCount(): Promise<number> {
  const snapshot = await db.collection(COLLECTION).get();
  return snapshot.docs.reduce((sum, doc) => sum + (doc.data().reviewCount || 0), 0);
}
