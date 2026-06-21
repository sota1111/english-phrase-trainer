import { NextRequest, NextResponse } from 'next/server';
import { parseJson } from '@/lib/validation/api-helper';
import { phraseGenerateSchema } from '@/lib/validation/schemas';
import { aiAvailable, getGenAIClient, getModelName, withRetry } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const result = await parseJson(request, phraseGenerateSchema);
    if (!result.success) {
      return result.response;
    }
    const { mode, text } = result.data;

    if (!aiAvailable()) {
      return NextResponse.json(
        {
          error: 'API_KEY_NOT_CONFIGURED',
          message:
            '自動生成が未設定のため利用できません（Vertex AI または API キー設定が必要です）。手動で入力してください。',
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

    const model = getModelName();
    let contentText = '';
    try {
      const ai = getGenAIClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
          },
        })
      );
      contentText = String(response.text ?? '').trim();
    } catch (genError) {
      console.error('Gemini (Vertex AI) generation error:', genError);
      return NextResponse.json(
        {
          error: 'GENERATION_FAILED',
          message:
            '自動生成に失敗しました（Vertex AI のクォータ超過の可能性があります）。手動で入力してください。',
        },
        { status: 502 }
      );
    }

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
