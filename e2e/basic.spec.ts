import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('英語フレーズ学習');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected pages', async ({ page }) => {
    const protectedPages = ['/', '/phrases', '/spaced-review', '/calendar'];
    for (const path of protectedPages) {
      await page.goto(path);
      await expect(page).toHaveURL(/.*\/login.*/);
    }
  });
});

test.describe('Authentication', () => {
  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'wrong@example.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // We expect some error message to appear
    await expect(page.locator('p[role="alert"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'E2E_TEST_EMAIL or E2E_TEST_PASSWORD not set');
      return;
    }

    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');

    // After login, it should redirect to home
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).not.toContainText('ログインしてください');
  });
});
