import { NextRequest, NextResponse } from 'next/server';
import { getPhrases } from '@/lib/firestore/phrases';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') ?? 'all';
    const category = searchParams.get('category') ?? '';
    const difficulty = searchParams.get('difficulty') ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50);

    let phrases = await getPhrases();

    if (mode === 'unanswered') {
      phrases = phrases.filter(p => p.answeredCount === 0);
    } else if (mode === 'weak') {
      phrases = phrases.filter(p => p.answeredCount > 0 && p.accuracy < 0.5);
    } else if (mode === 'category' && category) {
      phrases = phrases.filter(p => p.category === category);
    } else if (mode === 'difficulty' && difficulty) {
      phrases = phrases.filter(p => p.difficulty === difficulty);
    }

    // Fisher-Yates shuffle
    for (let i = phrases.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [phrases[i], phrases[j]] = [phrases[j], phrases[i]];
    }

    return NextResponse.json(phrases.slice(0, limit));
  } catch (error) {
    console.error('GET /api/review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
