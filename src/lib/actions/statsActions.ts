'use server';

import { countDueReviews } from '@/lib/firestore/reviewSchedules';
import { getDailyStat, getStreakDays, getTotalReviewCount, getMonthlyStats } from '@/lib/firestore/dailyStats';

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
