import { NextRequest, NextResponse } from 'next/server';
import { parseJson } from '@/lib/validation/api-helper';
import { writingFeedbackSchema } from '@/lib/validation/schemas';
import { aiAvailable, getGenAIClient, getModelName, withRetry } from '@/lib/ai/gemini';

/**
 * SOT-1075 / B2: AI writing feedback (AI英作文フィードバック).
 *
 * The user writes one English sentence using a target phrase. The AI grades the
 * sentence's grammar and naturalness (0–100), returns an improved version, and
 * gives short Japanese feedback (good points + improvement points).
 */
export async function POST(request: NextRequest) {
  try {
    const result = await parseJson(request, writingFeedbackSchema);
    if (!result.success) {
      return result.response;
    }
    const { phrase, meaningJa, sentence } = result.data;

    if (!aiAvailable()) {
      return NextResponse.json(
        {
          error: 'API_KEY_NOT_CONFIGURED',
          message:
            'AI添削が未設定のため利用できません（Vertex AI または API キー設定が必要です）。お手本なしで自由に英作文の練習を続けてください。',
        },
        { status: 503 }
      );
    }

    const systemPrompt = `You are a supportive English writing tutor for a Japanese learner.
The learner was asked to write ONE English sentence that uses a given target phrase.
Evaluate ONLY the learner's sentence. Be encouraging but honest.
Return STRICT JSON only (no markdown fence). Keys:
- score: integer 0-100 for overall grammar + naturalness (higher = better)
- corrected: a single corrected/improved English sentence (keep the learner's intent and the target phrase if reasonable; if the sentence is already good, return it largely unchanged)
- usesPhrase: boolean, true if the learner's sentence actually uses the target phrase (allow minor inflection)
- goodPoints: array of up to 3 SHORT comments in Japanese on what was done well (strings)
- improvements: array of up to 3 SHORT, concrete improvement comments in Japanese (strings)
- comment: one short overall encouragement sentence in Japanese
Arrays may be empty. Write goodPoints/improvements/comment in Japanese; corrected in English.`;

    const userMessage = `Target phrase: "${phrase.trim()}"${
      meaningJa.trim() ? `\nJapanese meaning of phrase: "${meaningJa.trim()}"` : ''
    }\nLearner's sentence: "${sentence.trim()}"`;

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
            maxOutputTokens: 768,
            responseMimeType: 'application/json',
          },
        })
      );
      contentText = String(response.text ?? '').trim();
    } catch (genError) {
      console.error('Gemini (Vertex AI) writing-feedback error:', genError);
      return NextResponse.json(
        {
          error: 'FEEDBACK_FAILED',
          message:
            'AI添削に失敗しました（Vertex AI のクォータ超過の可能性があります）。少し時間をおいて再度お試しください。',
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
          ? value.map((v) => String(v ?? '').trim()).filter((v) => v.length > 0).slice(0, 3)
          : [];
      const rawScore = Number(parsed.score);
      const score = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, Math.round(rawScore)))
        : 0;
      return NextResponse.json({
        result: {
          score,
          corrected: String(parsed.corrected ?? '').trim(),
          usesPhrase: Boolean(parsed.usesPhrase),
          goodPoints: toStringList(parsed.goodPoints),
          improvements: toStringList(parsed.improvements),
          comment: String(parsed.comment ?? '').trim(),
        },
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, contentText);
      return NextResponse.json(
        {
          error: 'FEEDBACK_FAILED',
          message: 'AI添削に失敗しました。少し時間をおいて再度お試しください。',
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('POST /api/phrases/writing-feedback error:', error);
    return NextResponse.json(
      { error: 'FEEDBACK_FAILED', message: 'AI添削に失敗しました。少し時間をおいて再度お試しください。' },
      { status: 502 }
    );
  }
}
