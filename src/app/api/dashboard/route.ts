import { NextRequest, NextResponse } from 'next/server';
import { countDueReviews } from '@/lib/firestore/reviewSchedules';
import { getDailyStat, getStreakDays, getTotalReviewCount, getMonthlyStats } from '@/lib/firestore/dailyStats';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    // Note: countDueReviews expected a Date object in SOT-384
    
    const [dueCount, todayStat, streakDays, totalReviews, monthlyStats] = await Promise.all([
      countDueReviews(today),
      getDailyStat(new Date()),
      getStreakDays(),
      getTotalReviewCount(),
      getMonthlyStats(today.getFullYear(), today.getMonth() + 1),
    ]);

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
