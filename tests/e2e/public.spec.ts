import { expect, test } from '@playwright/test';
import lesson from '../../content/lessons/standup-01.json' with { type: 'json' };

const PAGES = ['/', '/bang-gia', `/hoc/${lesson.slug}`, `/mau-cau/${lesson.slug}`];

for (const path of PAGES) {
  test(`${path} không cuộn ngang và có đúng một h1`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}

test.describe('khi tắt JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of [`/mau-cau/${lesson.slug}`, `/hoc/${lesson.slug}`]) {
    test(`${path} vẫn đọc được mẫu câu và ví dụ`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(lesson.pattern.formula)).toBeVisible();
      for (const ex of lesson.examples) {
        await expect(page.getByText(ex.en, { exact: true })).toBeVisible();
      }
      await expect(page.locator('.diff-line.del').first()).toBeVisible();
    });
  }
});

test('trang chủ có nút học thử dẫn tới bài 1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Học thử bài 1, miễn phí' })).toHaveAttribute('href', `/hoc/${lesson.slug}`);
});

test('giao diện đã chọn được áp dụng trước khi vẽ trang', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('epc:theme', 'dark'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Giao diện sáng' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('epc:theme'))).toBe('light');
});

test('đường dẫn không tồn tại trả về 404 có nội dung riêng', async ({ page }) => {
  const res = await page.goto('/khong-co-trang-nay');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Không có trang ở đường dẫn này');
});
