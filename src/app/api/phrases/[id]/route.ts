import { NextRequest, NextResponse } from 'next/server';
import { getPhraseById, updatePhrase, deletePhrase } from '@/lib/firestore/phrases';
import { PhraseInput } from '@/types/phrase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phrase = await getPhraseById(id);
    if (!phrase) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json(phrase);
  } catch (error) {
    console.error('GET /api/phrases/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<PhraseInput> = await request.json();
    await updatePhrase(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/phrases/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deletePhrase(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/phrases/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
