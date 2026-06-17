import { NextRequest, NextResponse } from 'next/server';
import { getPhraseById, updatePhrase, deletePhrase } from '@/lib/firestore/phrases';
import { parseJson } from '@/lib/validation/api-helper';
import { phraseUpdateSchema } from '@/lib/validation/schemas';

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
    const result = await parseJson(request, phraseUpdateSchema);
    if (!result.success) {
      return result.response;
    }
    await updatePhrase(id, result.data);
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
