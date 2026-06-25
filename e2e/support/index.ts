import crypto from 'node:crypto';
import type { Page } from '@playwright/test';

// 認証・APIモックの共通ヘルパ (SOT-1262)。シナリオ spec から再利用する。
//
// ミドルウェア（src/middleware.ts）は auth_token クッキーが
// HMAC-SHA256(AUTH_SECRET, 'english-phrase-trainer-auth') の16進と一致すれば保護ページを通す。
// playwright.config.ts の webServer.env で固定した AUTH_SECRET と同じ値でトークンを計算し、
// 実バックエンド（Firestore）なしで認証済みフローを検証する（SOT-1154 / flows.spec.ts と同方式）。
// 各ページは server component が Firestore 失敗を try/catch して空表示にフォールバックするため、
// 認証クッキーさえ通ればデータなしでもレンダリングされる（=シナリオはデータ非依存に保つ）。
export const E2E_AUTH_SECRET = process.env.AUTH_SECRET || 'e2e-playwright-secret';

export function authToken(secret: string): string {
  return crypto.createHmac('sha256', secret).update('english-phrase-trainer-auth').digest('hex');
}

export async function authenticate(page: Page, baseURL: string): Promise<void> {
  await page.context().addCookies([
    { name: 'auth_token', value: authToken(E2E_AUTH_SECRET), url: baseURL },
  ]);
}

export function pathnameOf(page: Page): string {
  return new URL(page.url()).pathname;
}

// クライアント側から叩かれる /api/phrases/* を決定的にモックする（「全 /api をモック」要件）。
// 本物の AI バックエンド（Vertex AI / Firestore）に依存せず、各 consumer が期待する
// レスポンス形状をそのまま返す。POST のみ fulfill し、それ以外は continue する。
export async function mockApi(page: Page): Promise<void> {
  const samplePhrase = {
    phrase: 'break the ice',
    meaningJa: '緊張をほぐす',
    example: 'He told a joke to break the ice.',
    exampleJa: '彼は緊張をほぐすために冗談を言った。',
    category: '会話',
    importance: 'normal',
  };

  // PhraseForm が叩く生成系（generate / parse / enrich）はフレーズオブジェクトを直接返す。
  for (const endpoint of ['generate', 'parse', 'enrich']) {
    await page.route(`**/api/phrases/${endpoint}`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(samplePhrase),
      });
    });
  }

  // WritingClient は data.result を参照する。
  await page.route('**/api/phrases/writing-feedback', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          score: 90,
          corrected: 'He told a joke to break the ice.',
          usesPhrase: true,
          goodPoints: ['自然な語順です'],
          improvements: [],
          comment: 'よくできました。',
        },
      }),
    });
  });
}
