'use server';

import { countDueReviews } from '@/lib/firestore/reviewSchedules';
import { getDailyStat, getStreakDays, getTotalReviewCount, getMonthlyStats, getRecentDailyStats } from '@/lib/firestore/dailyStats';
import { getPhrases } from '@/lib/firestore/phrases';

export async function getDashboardDataAction() {
  const today = new Date();
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const [dueCount, todayStat, streakDays, totalReviews, monthlyStats] = await Promise.all([
    countDueReviews(endOfToday),
    getDailyStat(today),
    getStreakDays(),
    getTotalReviewCount(),
    getMonthlyStats(today.getFullYear(), today.getMonth() + 1),
  ]);

  return {
    dueCount,
    todayReviewCount: todayStat?.reviewCount ?? 0,
    todayCorrectCount: todayStat?.correctCount ?? 0,
    streakDays,
    totalReviews,
    monthlyStats: monthlyStats.map(s => ({
      date: s.date,
      reviewCount: s.reviewCount,
      correctCount: s.correctCount,
    })),
  };
}

// Accuracy buckets for the retention distribution (提案4). Each bucket counts
// answered phrases whose accuracy falls in [min, max].
const ACCURACY_BUCKETS: { key: string; min: number; max: number }[] = [
  { key: '0-49', min: 0, max: 0.4999 },
  { key: '50-69', min: 0.5, max: 0.6999 },
  { key: '70-89', min: 0.7, max: 0.8999 },
  { key: '90-100', min: 0.9, max: 1 },
];

/**
 * Aggregate data for the learning analytics dashboard (提案4):
 * retention (overall accuracy + accuracy distribution), weak phrases, and the
 * recent daily-review trend. Pure read; safe to call on every request.
 */
export async function getAnalyticsAction() {
  const [phrases, recentDaily] = await Promise.all([
    getPhrases(),
    getRecentDailyStats(14),
  ]);

  const answered = phrases.filter((p) => p.answeredCount > 0);
  const totalCorrect = phrases.reduce((sum, p) => sum + p.correctCount, 0);
  const totalAnswered = phrases.reduce((sum, p) => sum + p.answeredCount, 0);
  const overallAccuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

  const distribution = ACCURACY_BUCKETS.map((b) => ({
    key: b.key,
    count: answered.filter((p) => p.accuracy >= b.min && p.accuracy <= b.max).length,
  }));

  const weakPhrases = answered
    .filter((p) => p.accuracy < 0.5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      phrase: p.phrase,
      meaningJa: p.meaningJa,
      accuracy: p.accuracy,
      answeredCount: p.answeredCount,
    }));

  return {
    totalPhrases: phrases.length,
    answeredPhrases: answered.length,
    unansweredPhrases: phrases.length - answered.length,
    overallAccuracy,
    totalAnswered,
    distribution,
    weakPhrases,
    dailyTrend: recentDaily.map((s) => ({
      date: s.date,
      reviewCount: s.reviewCount ?? 0,
      correctCount: s.correctCount ?? 0,
    })),
  };
}

export async function getMonthlyStatsAction(year: number, month: number) {
  const [monthlyStats, streakDays] = await Promise.all([
    getMonthlyStats(year, month),
    getStreakDays(),
  ]);

  return {
    year,
    month,
    streakDays,
    days: monthlyStats.map(s => ({
      date: s.date,
      reviewCount: s.reviewCount,
      correctCount: s.correctCount,
    })),
  };
}
