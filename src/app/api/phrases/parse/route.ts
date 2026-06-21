import { NextRequest, NextResponse } from 'next/server';
import { parseJson } from '@/lib/validation/api-helper';
import { phraseParseSchema } from '@/lib/validation/schemas';
import { aiAvailable, getGenAIClient, getModelName, withRetry } from '@/lib/ai/gemini';
import { Importance } from '@/types/phrase';

// Bulk parsing sends a large blob to Gemini and may take longer than a single
// generation; allow extra time on platforms that honor this hint.
export const maxDuration = 60;

type PhraseDraft = {
  phrase: string;
  meaningJa: string;
  example: string;
  exampleJa: string;
  category: string;
  importance: Importance;
};

function normalizeImportance(value: unknown): Importance {
  return value === 'high' || value === 'low' ? value : 'normal';
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseJson(request, phraseParseSchema);
    if (!result.success) {
      return result.response;
    }
    const { text } = result.data;

    if (!aiAvailable()) {
      return NextResponse.json(
        {
          error: 'API_KEY_NOT_CONFIGURED',
          message:
            '自動解析が未設定のため利用できません（Vertex AI または API キー設定が必要です）。手動で入力してください。',
        },
        { status: 503 }
      );
    }

    const systemPrompt = `You are an English-learning phrase extractor.
The user pastes ONE free-form blob mixing English words, idioms, full sentences, their Japanese meanings, and notes.
Split it into individual learnable items. For EACH item, output an object with:
- phrase: the English phrase/word (required, non-empty, trimmed)
- meaningJa: the Japanese meaning. Use the one supplied in the source if present; otherwise translate it yourself.
- example: a natural English example sentence using the phrase (generate one if the source has none)
- exampleJa: the Japanese translation of the example
- category: a SHORT Japanese category label (e.g. 日常会話, ビジネス, 食事, 旅行, 動詞句, イディオム, 時間表現)
- importance: exactly one of "high", "normal", or "low" — your best judgment of how useful/common the phrase is for an intermediate learner (common and broadly useful -> high; niche or rare -> low)
Rules:
- Drop pure headers/notes that are not phrases (e.g. 覚える, 使いたい表現).
- Do NOT merge unrelated items; one entry per phrase/idiom/sentence.
- Return STRICT JSON only, no markdown fence: an object of the form {"items": [ ... ]}.`;

    const userMessage = `Free-form input to split into phrase entries:\n"""\n${text.trim()}\n"""`;

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
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        })
      );
      contentText = String(response.text ?? '').trim();
    } catch (genError) {
      console.error('Gemini (Vertex AI) bulk parse error:', genError);
      return NextResponse.json(
        {
          error: 'GENERATION_FAILED',
          message:
            '自動解析に失敗しました（Vertex AI のクォータ超過の可能性があります）。手動で入力してください。',
        },
        { status: 502 }
      );
    }

    // Defensive parsing: strip markdown fences if present.
    if (contentText.startsWith('```')) {
      contentText = contentText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(contentText);
      const rawItems: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
          ? parsed.items
          : [];

      const results: PhraseDraft[] = rawItems
        .map((item): PhraseDraft => {
          const obj = (item ?? {}) as Record<string, unknown>;
          return {
            phrase: String(obj.phrase ?? '').trim(),
            meaningJa: String(obj.meaningJa ?? '').trim(),
            example: String(obj.example ?? '').trim(),
            exampleJa: String(obj.exampleJa ?? '').trim(),
            category: String(obj.category ?? '').trim(),
            importance: normalizeImportance(obj.importance),
          };
        })
        .filter((draft) => draft.phrase.length > 0);

      return NextResponse.json({ results });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, contentText);
      return NextResponse.json(
        { error: 'GENERATION_FAILED', message: '自動解析に失敗しました。手動で入力してください。' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('POST /api/phrases/parse error:', error);
    return NextResponse.json(
      { error: 'GENERATION_FAILED', message: '自動解析に失敗しました。手動で入力してください。' },
      { status: 502 }
    );
  }
}
