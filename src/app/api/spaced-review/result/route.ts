import { NextRequest, NextResponse } from 'next/server';
import { getPhraseById } from '@/lib/firestore/phrases';
import { getReviewSchedule, upsertReviewSchedule } from '@/lib/firestore/reviewSchedules';
import { incrementDailyStat } from '@/lib/firestore/dailyStats';
import { calculateNextReview, DEFAULT_SM2_PARAMS } from '@/lib/sm2';
import { parseJson } from '@/lib/validation/api-helper';
import { spacedReviewResultSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const result = await parseJson(request, spacedReviewResultSchema);
    if (!result.success) {
      return result.response;
    }
    const { phraseId, isCorrect } = result.data;

    const phrase = await getPhraseById(phraseId);
    if (!phrase) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    const schedule = await getReviewSchedule(phraseId);
    const params = {
      easeFactor: schedule.easeFactor ?? DEFAULT_SM2_PARAMS.easeFactor,
      interval: schedule.interval ?? DEFAULT_SM2_PARAMS.interval,
      repetitions: schedule.repetitions ?? DEFAULT_SM2_PARAMS.repetitions,
    };

    const next = calculateNextReview(params, isCorrect);
    await upsertReviewSchedule(phraseId, next);
    await incrementDailyStat(new Date(), isCorrect, phraseId);

    return NextResponse.json({
      phraseId,
      isCorrect,
      nextReview: next,
    });
  } catch (error) {
    console.error('POST /api/spaced-review/result error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
