import { defineConfig, devices } from '@playwright/test';

const PORT = 4330;
const BASE = `http://localhost:${PORT}`;

/**
 * Tự build rồi chạy bản build. Dùng Supabase giả khi máy chưa có .env; có .env thì giá trị trong đó được ưu tiên.
 * Không gọi mạng: các test chỉ kiểm luồng khi chưa có session (chuyển hướng, 401, cookie PKCE).
 * Đăng nhập OAuth thật kiểm bằng tay.
 */
const FAKE_SUPABASE_URL = 'https://epc-test.supabase.co';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: BASE },
  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 800 }, hasTouch: true } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: `npx astro build && npx astro preview --port ${PORT}`,
    url: BASE,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PUBLIC_SUPABASE_URL: FAKE_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-not-a-real-key-000000',
      PUBLIC_SITE_URL: BASE,
    },
  },
});
