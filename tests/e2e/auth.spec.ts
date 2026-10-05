import { expect, test } from '@playwright/test';

test.describe('khi chưa đăng nhập', () => {
  for (const path of ['/hom-nay', '/tai-khoan', '/xep-trinh-do', '/on-tap', '/so-loi', '/phong-van-thu']) {
    test(`${path} chuyển tới trang đăng nhập`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL((url) => url.pathname === '/dang-nhap' && url.searchParams.get('next') === path);
      await expect(page.getByRole('button', { name: 'Đăng nhập bằng Google' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Đăng nhập bằng GitHub' })).toBeVisible();
    });
  }

  test('trang đăng nhập không được cache và không được index', async ({ request, page }) => {
    const res = await request.get('/dang-nhap');
    expect(res.headers()['cache-control']).toBe('no-store');
    await page.goto('/dang-nhap');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('báo lỗi khi đăng nhập không thành công', async ({ page }) => {
    await page.goto('/dang-nhap?loi=1');
    await expect(page.getByRole('alert')).toContainText('Chưa đăng nhập được');
  });

  test('POST /api/progress trả 401 dạng JSON chung', async ({ request, baseURL }) => {
    const res = await request.post('/api/progress', {
      headers: { Origin: baseURL ?? '' },
      data: { progress: {} },
    });
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({
      ok: false,
      error: { code: 'unauthenticated', message: 'Bạn cần đăng nhập để làm việc này.' },
    });
    expect(res.headers()['cache-control']).toBe('no-store');
  });

  test('GET /api/progress trả 401 để trang bài học dùng tiến độ trên trình duyệt', async ({ request }) => {
    const res = await request.get('/api/progress?lesson=standup-01');
    expect(res.status()).toBe(401);
  });

  test('POST /api/review trả 401 khi chưa đăng nhập', async ({ request, baseURL }) => {
    const res = await request.post('/api/review', {
      headers: { Origin: baseURL ?? '' },
      data: { item_id: '7b0c6a43-4c1e-4a43-9a3a-2f0f1b9f1a01', choice: 0 },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/correct trả 401 khi chưa đăng nhập, 403 khi từ trang khác, 405 với GET', async ({ request, baseURL }) => {
    const res = await request.post('/api/correct', { headers: { Origin: baseURL ?? '' }, data: { sentence: 'I have fixed bug.' } });
    expect(res.status()).toBe(401);
    expect(res.headers()['cache-control']).toBe('no-store');
    const evil = await request.post('/api/correct', { headers: { Origin: 'https://evil.example' }, data: { sentence: 'x' } });
    expect(evil.status()).toBe(403);
    expect((await request.get('/api/correct')).status()).toBe(405);
  });

  test('POST /api/progress từ trang khác bị chặn', async ({ request }) => {
    const res = await request.post('/api/progress', { headers: { Origin: 'https://evil.example' }, data: { progress: {} } });
    expect(res.status()).toBe(403);
  });
});

test.describe('bắt đầu đăng nhập OAuth', () => {
  test('chuyển tới Supabase và lưu mã PKCE trong cookie HttpOnly', async ({ request, baseURL }) => {
    const res = await request.post('/auth/signin', {
      headers: { Origin: baseURL ?? '' },
      form: { provider: 'github', next: '/hom-nay' },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(303);
    const location = new URL(res.headers()['location'] ?? '');
    // URL giả của Playwright, hoặc project thật nếu máy có .env (giá trị trong .env được ưu tiên khi build).
    expect(location.hostname).toMatch(/\.supabase\.co$/);
    expect(location.pathname).toBe('/auth/v1/authorize');
    expect(location.searchParams.get('provider')).toBe('github');
    expect(location.searchParams.get('code_challenge_method')).toBe('s256');
    expect(new URL(location.searchParams.get('redirect_to') ?? '').pathname).toBe('/auth/callback');

    const cookie = res.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie' && h.value.includes('code-verifier'));
    expect(cookie?.value).toMatch(/HttpOnly/i);
    expect(cookie?.value).toMatch(/SameSite=Lax/i);
  });

  test('từ trang khác thì không bắt đầu đăng nhập', async ({ request }) => {
    const res = await request.post('/auth/signin', {
      headers: { Origin: 'https://evil.example' },
      form: { provider: 'github' },
      maxRedirects: 0,
    });
    // Astro chặn form POST khác nguồn (security.checkOrigin) trước cả kiểm tra của endpoint.
    expect(res.status()).toBe(403);
    expect(res.headers()['location']).toBeUndefined();
  });

  test('provider lạ bị từ chối', async ({ request, baseURL }) => {
    const res = await request.post('/auth/signin', {
      headers: { Origin: baseURL ?? '' },
      form: { provider: 'facebook' },
      maxRedirects: 0,
    });
    expect(res.headers()['location']).toBe('/dang-nhap?loi=1');
  });

  test('callback thiếu code quay về trang đăng nhập', async ({ request }) => {
    const res = await request.get('/auth/callback', { maxRedirects: 0 });
    expect(res.headers()['location']).toBe('/dang-nhap?loi=1');
  });
});
