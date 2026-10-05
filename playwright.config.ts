import { defineConfig, devices } from '@playwright/test';

const PORT = 4330;

// Chạy trên bản build: `npm run build` trước rồi `npm run test:e2e`.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 800 }, hasTouch: true } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
