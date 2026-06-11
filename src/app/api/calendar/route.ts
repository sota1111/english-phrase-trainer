import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyStats, getStreakDays } from '@/lib/firestore/dailyStats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);

    const [monthlyStats, streakDays] = await Promise.all([
      getMonthlyStats(year, month),
      getStreakDays(),
    ]);

    return NextResponse.json({
      year,
      month,
      streakDays,
      days: monthlyStats.map(s => ({
        date: s.date,
        reviewCount: s.reviewCount,
        correctCount: s.correctCount,
      })),
    });
  } catch (error) {
    console.error('GET /api/calendar error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
