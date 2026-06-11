import { NextResponse } from 'next/server';
import { getPhrases } from '@/lib/firestore/phrases';
import { getDueReviews } from '@/lib/firestore/reviewSchedules';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [dueSchedules, allPhrases] = await Promise.all([
      getDueReviews(today),
      getPhrases(),
    ]);

    const phraseMap = new Map(allPhrases.map(p => [p.id, p]));
    const duePhrases = dueSchedules
      .map(s => ({
        schedule: s,
        phrase: phraseMap.get(s.phraseId),
      }))
      .filter(item => item.phrase !== undefined);

    // Also include phrases that have no schedule yet (never reviewed)
    const scheduledIds = new Set(dueSchedules.map(s => s.phraseId));
    const unscheduledPhrases = allPhrases
      .filter(p => !scheduledIds.has(p.id))
      .map(p => ({
        schedule: null,
        phrase: p,
      }));

    const result = [...duePhrases, ...unscheduledPhrases].map(item => ({
      phrase: item.phrase,
      schedule: item.schedule,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/spaced-review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
