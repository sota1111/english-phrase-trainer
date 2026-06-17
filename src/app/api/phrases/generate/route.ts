import { NextRequest, NextResponse } from 'next/server';
import { parseJson } from '@/lib/validation/api-helper';
import { phraseGenerateSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const result = await parseJson(request, phraseGenerateSchema);
    if (!result.success) {
      return result.response;
    }
    const { mode, text } = result.data;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'API_KEY_NOT_CONFIGURED',
          message: 'ANTHROPIC_API_KEY が未設定のため自動生成は利用できません。手動で入力してください。',
        },
        { status: 503 }
      );
    }

    const systemPrompt = `You are an English-learning phrase generator.
Generate a natural English phrase, its Japanese meaning, an example sentence, its Japanese translation, and a short Japanese category label.
Return the result as STRICT JSON only (no markdown fence).
Keys:
- phrase: the English phrase or word
- meaningJa: the Japanese meaning
- example: an English example sentence using the phrase
- exampleJa: the Japanese translation of the example
- category: a short Japanese category label`;

    let userMessage = '';
    if (mode === 'ja2en') {
      userMessage = `Generate English phrase data for the Japanese meaning: "${text.trim()}"`;
    } else {
      userMessage = `Generate Japanese translation and data for the English phrase: "${text.trim()}"`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'GENERATION_FAILED', message: '自動生成に失敗しました。手動で入力してください。' },
        { status: 502 }
      );
    }

    const data = await response.json();
    let contentText = data.content[0].text.trim();
    
    // Defensive parsing: strip markdown fences if present
    if (contentText.startsWith('```')) {
      contentText = contentText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    }

    try {
      const result = JSON.parse(contentText);
      return NextResponse.json({
        result: {
          phrase: String(result.phrase || '').trim(),
          meaningJa: String(result.meaningJa || '').trim(),
          example: String(result.example || '').trim(),
          exampleJa: String(result.exampleJa || '').trim(),
          category: String(result.category || '').trim(),
        },
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, contentText);
      return NextResponse.json(
        { error: 'GENERATION_FAILED', message: '自動生成に失敗しました。手動で入力してください。' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('POST /api/phrases/generate error:', error);
    return NextResponse.json(
      { error: 'GENERATION_FAILED', message: '自動生成に失敗しました。手動で入力してください。' },
      { status: 502 }
    );
  }
}
