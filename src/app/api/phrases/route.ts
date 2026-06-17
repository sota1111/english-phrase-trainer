import { NextRequest, NextResponse } from 'next/server';
import { getPhrases, createPhrase } from '@/lib/firestore/phrases';
import { parseJson } from '@/lib/validation/api-helper';
import { phraseInputSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const phrases = await getPhrases();
    return NextResponse.json(phrases);
  } catch (error) {
    console.error('GET /api/phrases error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseJson(request, phraseInputSchema);
    if (!result.success) {
      return result.response;
    }
    const phrase = await createPhrase(result.data);
    return NextResponse.json(phrase, { status: 201 });
  } catch (error) {
    console.error('POST /api/phrases error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
