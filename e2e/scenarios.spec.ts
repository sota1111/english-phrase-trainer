import { test, expect } from '@playwright/test';
import { authenticate, mockApi } from './support';

// ユーザー操作 → 画面遷移/表示を検証するシナリオe2e (SOT-1262 / 親 SOT-1258)。
// 1 シナリオ = 1 ユーザーストーリー。認証は auth_token クッキー、/api はモックで決定的にする。
// サーバーコンポーネントは Firestore 不在時に空表示へフォールバックするため、アサーションは
// データ非依存の構造/href ベース（i18n 非依存）に保つ。

test.describe('Scenario e2e', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await mockApi(page);
    await authenticate(page, baseURL!);
  });

  // S1: ホームの学習導線から英作文ページへ遷移できる。
  test('home → writing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav.home-nav')).toBeVisible();
    await page.locator('nav.home-nav a[href="/writing"]').click();
    await expect(page).toHaveURL(/\/writing$/);
    await expect(page.locator('.writing')).toBeVisible();
  });

  // S2: ホームの学習導線から復習ページへ遷移できる。
  test('home → spaced-review', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav.home-nav a[href="/spaced-review"]').click();
    await expect(page).toHaveURL(/\/spaced-review/);
    await expect(page.locator('h1')).toBeVisible();
  });

  // S3: ホームから分析画面へ遷移し、見出しが表示される。
  test('home → analytics', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav.home-nav a[href="/analytics"]').click();
    await expect(page).toHaveURL(/\/analytics$/);
    await expect(page.locator('.analytics-header h1')).toBeVisible();
  });

  // S4: 復習画面で重要度フィルタを選ぶと URL クエリが変わる。
  test('spaced-review → importance filter updates URL', async ({ page }) => {
    await page.goto('/spaced-review');
    await expect(page.locator('h1')).toBeVisible();
    await page.locator('a[href*="importance=high"]').click();
    await expect(page).toHaveURL(/importance=high/);
  });

  // S5: フレーズ一覧で追加ボタンを押すと作成モーダルが開く。
  test('phrases → add button opens create modal', async ({ page }) => {
    await page.goto('/phrases');
    const addButton = page.locator('button.add-button');
    await expect(addButton).toBeVisible();
    await addButton.click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });
});
