import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // 認証フロー E2E 用の固定シークレット（SOT-1154）。テスト側は同じ値で auth_token クッキーを
    // 計算してミドルウェアを通過させる。process.env は .env.local より優先されるため決定的。
    env: { AUTH_SECRET: process.env.AUTH_SECRET || 'e2e-playwright-secret' },
  },
});
