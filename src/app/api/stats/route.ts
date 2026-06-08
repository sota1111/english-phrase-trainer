import { NextResponse } from 'next/server';
import { getPhrases } from '@/lib/firestore/phrases';

export async function GET() {
  try {
    const phrases = await getPhrases();
    const totalPhrases = phrases.length;
    const answeredPhrases = phrases.filter(p => p.answeredCount > 0).length;
    const unansweredPhrases = totalPhrases - answeredPhrases;
    const weakPhrases = phrases.filter(p => p.answeredCount > 0 && p.accuracy < 0.5).length;
    const averageAccuracy = answeredPhrases > 0
      ? phrases.filter(p => p.answeredCount > 0).reduce((sum, p) => sum + p.accuracy, 0) / answeredPhrases
      : 0;
    return NextResponse.json({
      totalPhrases,
      answeredPhrases,
      unansweredPhrases,
      weakPhrases,
      averageAccuracy,
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
