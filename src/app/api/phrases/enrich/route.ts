import { NextRequest, NextResponse } from 'next/server';
import { parseJson } from '@/lib/validation/api-helper';
import { phraseEnrichSchema } from '@/lib/validation/schemas';
import { aiAvailable, getGenAIClient, getModelName, withRetry } from '@/lib/ai/gemini';

/**
 * 提案2: AI enrichment. Given an English phrase (and optional Japanese meaning),
 * return synonyms, collocations, and extra example sentences as study aids.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await parseJson(request, phraseEnrichSchema);
    if (!result.success) {
      return result.response;
    }
    const { phrase, meaningJa } = result.data;

    if (!aiAvailable()) {
      return NextResponse.json(
        {
          error: 'API_KEY_NOT_CONFIGURED',
          message:
            'AI拡充が未設定のため利用できません（Vertex AI または API キー設定が必要です）。手動で入力してください。',
        },
        { status: 503 }
      );
    }

    const systemPrompt = `You are an English-learning assistant that enriches a phrase with study aids.
Given an English phrase (and optionally its Japanese meaning), produce useful learning material.
Return STRICT JSON only (no markdown fence). Keys:
- synonyms: array of up to 5 short English synonyms or near-synonyms (strings)
- collocations: array of up to 5 common English collocations / set phrases using the phrase (strings)
- examples: array of up to 3 short, natural English example sentences using the phrase (strings)
Each array may be empty if nothing natural applies. Do not include Japanese in the arrays.`;

    const userMessage = `Phrase: "${phrase.trim()}"${
      meaningJa.trim() ? `\nJapanese meaning: "${meaningJa.trim()}"` : ''
    }`;

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
      console.error('Gemini (Vertex AI) enrichment error:', genError);
      return NextResponse.json(
        {
          error: 'ENRICHMENT_FAILED',
          message:
            'AI拡充に失敗しました（Vertex AI のクォータ超過の可能性があります）。手動で入力してください。',
        },
        { status: 502 }
      );
    }

    if (contentText.startsWith('```')) {
      contentText = contentText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(contentText);
      const toStringList = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.map((v) => String(v ?? '').trim()).filter((v) => v.length > 0).slice(0, 5)
          : [];
      return NextResponse.json({
        result: {
          synonyms: toStringList(parsed.synonyms),
          collocations: toStringList(parsed.collocations),
          examples: toStringList(parsed.examples).slice(0, 3),
        },
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, contentText);
      return NextResponse.json(
        { error: 'ENRICHMENT_FAILED', message: 'AI拡充に失敗しました。手動で入力してください。' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('POST /api/phrases/enrich error:', error);
    return NextResponse.json(
      { error: 'ENRICHMENT_FAILED', message: 'AI拡充に失敗しました。手動で入力してください。' },
      { status: 502 }
    );
  }
}
