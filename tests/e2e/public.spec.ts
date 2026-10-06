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
  await expect(page.getByRole('link', { name: 'Học thử miễn phí' })).toHaveAttribute('href', `/hoc/${lesson.slug}`);
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

test('thanh trên đánh dấu trang đang mở và dẫn tới các trang chính', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Màn hẹp dùng nút Menu, có test riêng.');
  await page.goto('/bang-gia');
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  await expect(nav.getByRole('link', { name: 'Bảng giá' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Học miễn phí' }).first()).toHaveAttribute('href', '/hom-nay');
  const foot = page.getByRole('navigation', { name: 'Tài khoản' });
  for (const name of ['Sổ lỗi', 'Phỏng vấn thử', 'Kiểm tra trình độ', 'Nâng cấp']) {
    await expect(foot.getByRole('link', { name })).toBeVisible();
  }
});

test.describe('điện thoại', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('menu gom các trang, mở được cả khi tắt JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByText('Menu', { exact: true }).click();
    const menu = page.getByRole('navigation', { name: 'Menu' });
    for (const name of ['Bài học', 'Tìm lỗi mỗi ngày', 'Bảng giá', 'Học miễn phí']) {
      await expect(menu.getByRole('link', { name })).toBeVisible();
    }
    await ctx.close();
  });
});

test('hero: người xem bấm chữ sai rồi thấy câu đúng và lời Coach', async ({ page }) => {
  await page.goto('/');
  const demo = page.locator('[data-demo]');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo.getByText('Bấm vào chữ bạn thấy sai.')).toBeVisible({ timeout: 8000 });
  // "have" là chữ sai trong ví dụ đầu; bấm nhầm thêm 3 chữ đúng để chắc chắn kết thúc.
  await demo.locator('.demo-tok', { hasText: /^have$/ }).click();
  for (const w of ['Yesterday', 'fixed', 'the']) {
    const tok = demo.locator('.demo-tok:not([disabled])', { hasText: new RegExp(`^${w}$`) }).first();
    if (await tok.count()) await tok.click();
  }
  await expect(demo.locator('[data-demo-addline]')).toBeVisible({ timeout: 8000 });
  await expect(demo.locator('[data-demo-comment]')).toBeVisible({ timeout: 8000 });
});

test('nút Telegram nổi có ở mọi trang và dẫn qua /telegram', async ({ page, request }) => {
  for (const path of ['/', '/bang-gia', `/hoc/hom-qua-da-lam-gi`]) {
    await page.goto(path);
    const fab = page.getByRole('link', { name: /Chat với bot Telegram/ });
    await expect(fab).toBeVisible();
    await expect(fab).toHaveAttribute('href', '/telegram');
  }
  const res = await request.get('/telegram', { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()['location']).toMatch(/^(https:\/\/t\.me\/|\/tai-khoan)/);
  expect(res.headers()['cache-control']).toBe('no-store');
});

test('điện thoại 360px: không trang công khai nào tràn ngang (đo khi đã tắt lưới an toàn overflow-x)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const path of ['/', '/bang-gia', '/bug-hom-nay', '/hoc/hom-qua-da-lam-gi', '/mau-cau/hom-qua-da-lam-gi', '/dieu-khoan', '/dang-nhap']) {
    await page.goto(path);
    const [scroll, view] = await page.evaluate(() => {
      document.documentElement.style.overflowX = 'visible';
      document.body.style.overflowX = 'visible';
      return [document.documentElement.scrollWidth, document.documentElement.clientWidth];
    });
    expect(scroll, `${path} tràn ngang`).toBeLessThanOrEqual(view);
  }
  await ctx.close();
});
