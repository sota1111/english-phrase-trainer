import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';

// ミドルウェア（src/middleware.ts）は auth_token クッキーが
// HMAC-SHA256(AUTH_SECRET, 'english-phrase-trainer-auth') の16進と一致すれば保護ページを通す。
// playwright.config.ts の webServer.env で固定した AUTH_SECRET と同じ値でトークンを計算し、
// 実バックエンド（Firestore）なしで認証済みフローを検証する（SOT-1154）。
// 各ページは server component が Firestore 失敗を try/catch して空表示にフォールバックするため、
// 認証クッキーさえ通ればデータなしでもレンダリングされる。
const E2E_AUTH_SECRET = process.env.AUTH_SECRET || 'e2e-playwright-secret';

function authToken(secret: string): string {
  return crypto.createHmac('sha256', secret).update('english-phrase-trainer-auth').digest('hex');
}

async function authenticate(page: import('@playwright/test').Page, baseURL: string) {
  await page.context().addCookies([
    { name: 'auth_token', value: authToken(E2E_AUTH_SECRET), url: baseURL },
  ]);
}

function pathnameOf(page: import('@playwright/test').Page): string {
  return new URL(page.url()).pathname;
}

test.describe('Authenticated flows', () => {
  test('home dashboard renders when authenticated (not redirected to login)', async ({ page, baseURL }) => {
    await authenticate(page, baseURL!);
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login/);
    // ホーム本文（ログインページには無い見出し）が描画される。
    await expect(page.locator('h1.page-title')).toBeVisible();
    await expect(page.locator('nav.home-nav')).toBeVisible();
  });

  test('phrases page renders list UI (add button) when authenticated', async ({ page, baseURL }) => {
    await authenticate(page, baseURL!);
    await page.goto('/phrases');
    await expect(page).not.toHaveURL(/\/login/);
    // PhrasesClient は phrases ページでのみレンダリングされる add-button を持つ。
    await expect(page.locator('button.add-button')).toBeVisible();
  });

  test('bottom tab navigation stays authenticated across all tabs', async ({ page, baseURL }) => {
    // BottomTabBar は max-width:480px のモバイル幅でのみ表示される（root layout に常駐）。
    await page.setViewportSize({ width: 390, height: 844 });
    await authenticate(page, baseURL!);
    await page.goto('/');
    await expect(page.locator('nav.bottom-tabs')).toBeVisible();
    const hrefs = ['/phrases', '/analytics', '/calendar', '/'];
    for (const href of hrefs) {
      await page.locator(`nav.bottom-tabs a[href="${href}"]`).click();
      await expect.poll(() => pathnameOf(page)).toBe(href);
      await expect(page).not.toHaveURL(/\/login/);
    }
  });
});
