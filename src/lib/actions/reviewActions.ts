'use server';

import { getPhrases, getPhraseById, updatePhraseStats } from '@/lib/firestore/phrases';
import { getDueReviews, getReviewSchedule, upsertReviewSchedule } from '@/lib/firestore/reviewSchedules';
import { incrementDailyStat } from '@/lib/firestore/dailyStats';
import { createLearningRecord } from '@/lib/firestore/learningRecords';
import { calculateNextReview, orderByReviewUrgency, DEFAULT_SM2_PARAMS } from '@/lib/sm2';
import { filterByImportance } from '@/lib/importance';
import { Importance } from '@/types/phrase';
import { spacedReviewResultSchema, learningRecordSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type SpacedReviewResultInput = z.infer<typeof spacedReviewResultSchema>;
type LearningRecordInput = z.infer<typeof learningRecordSchema>;

export async function getDuePhrasesAction(importance?: Importance) {
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

  const scheduledIds = new Set(dueSchedules.map(s => s.phraseId));
  const unscheduledPhrases = allPhrases
    .filter(p => !scheduledIds.has(p.id))
    .map(p => ({
      schedule: null,
      phrase: p,
    }));

  const combined = [...duePhrases, ...unscheduledPhrases].map(item => ({
    phrase: item.phrase!,
    schedule: item.schedule,
  }));

  // Narrow to the chosen importance BEFORE ordering so SRS urgency order survives.
  const scoped = filterByImportance(combined, importance);

  // SRS ordering: most overdue (earliest dueDate) first; never-scheduled phrases last.
  return orderByReviewUrgency(scoped, item =>
    item.schedule?.dueDate ? item.schedule.dueDate.toMillis() : null,
  );
}

export async function submitReviewResultAction(input: SpacedReviewResultInput) {
  const validated = spacedReviewResultSchema.parse(input);
  const { phraseId, isCorrect } = validated;

  const phrase = await getPhraseById(phraseId);
  if (!phrase) {
    throw new Error('Phrase not found');
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

  revalidatePath('/');
  revalidatePath('/spaced-review');
  revalidatePath('/calendar');
  
  return {
    phraseId,
    isCorrect,
    nextReview: next,
  };
}

export async function createLearningRecordAction(input: LearningRecordInput) {
  const validated = learningRecordSchema.parse(input);
  const { phraseId, quizType, answer, correctAnswer } = validated;
  
  const isCorrect = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  
  const record = await createLearningRecord({
    phraseId,
    quizType,
    isCorrect,
    answer,
    correctAnswer,
  });
  
  await updatePhraseStats(phraseId, isCorrect);
  
  revalidatePath('/');
  revalidatePath('/phrases');
  
  return record;
}
