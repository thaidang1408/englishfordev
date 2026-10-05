import { expect, test } from '@playwright/test';
import lesson from '../../content/lessons/standup-01.json' with { type: 'json' };

const PAGES = ['/', '/bang-gia', '/bug-hom-nay', '/dieu-khoan', '/bao-mat', `/hoc/${lesson.slug}`, `/mau-cau/${lesson.slug}`];

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

test('bài không tồn tại dưới /hoc cũng trả về 404 có nội dung riêng', async ({ page }) => {
  const res = await page.goto('/hoc/khong-co-bai-nay');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Không có trang ở đường dẫn này');
});

test('bảng giá có nút mua từng gói, dẫn tới trang nâng cấp', async ({ page }) => {
  await page.goto('/bang-gia');
  await expect(page.getByRole('link', { name: 'Mua gói 30 ngày' })).toHaveAttribute('href', '/nang-cap?goi=30d');
  await expect(page.getByRole('link', { name: 'Mua gói 90 ngày' })).toHaveAttribute('href', '/nang-cap?goi=90d');
});

test('đường dẫn không tồn tại trả về 404 có nội dung riêng', async ({ page }) => {
  const res = await page.goto('/khong-co-trang-nay');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Không có trang ở đường dẫn này');
});

test('sitemap có trang công khai và 30 trang mẫu câu, không có bài Premium', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('/dieu-khoan</loc>');
  expect(xml).toContain(`/hoc/${lesson.slug}</loc>`);
  expect(xml.match(/\/mau-cau\//g)).toHaveLength(30);
  expect(xml).not.toContain('/hoc/gioi-thieu-ban-than');
  expect(await (await request.get('/robots.txt')).text()).toContain('/sitemap.xml');
});

test('trang có ảnh OG và favicon', async ({ page, request }) => {
  await page.goto('/');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/\/og\.png$/);
  for (const path of ['/og.png', '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png']) {
    expect((await request.get(path)).status()).toBe(200);
  }
});

test('trang ghi sự kiện page_view khi mở', async ({ page }) => {
  const sent = page.waitForRequest((r) => r.url().endsWith('/api/events') && r.method() === 'POST');
  await page.goto(`/hoc/${lesson.slug}`);
  const bodies = [(await sent).postDataJSON() as { name: string; anon_id: string }];
  expect(bodies[0]?.name).toBe('page_view');
  expect(bodies[0]?.anon_id).toMatch(/^[A-Za-z0-9-]{8,64}$/);
});

test('POST /api/events từ trang khác bị chặn, tên chỉ server được ghi bị từ chối', async ({ request, baseURL }) => {
  const anon_id = '3f2a9c1e-0b7d-4e55-9a61-2c8d7f0e4b12';
  const evil = await request.post('/api/events', { headers: { Origin: 'https://evil.test' }, data: { name: 'page_view', anon_id } });
  expect(evil.status()).toBe(403);
  const fake = await request.post('/api/events', { headers: { Origin: baseURL! }, data: { name: 'order_paid', anon_id } });
  expect(fake.status()).toBe(400);
});
