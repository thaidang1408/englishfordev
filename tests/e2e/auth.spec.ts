import { expect, test } from '@playwright/test';
import { FAKE_SUPABASE_URL } from '../../playwright.config';

test.describe('khi chưa đăng nhập', () => {
  for (const path of ['/hom-nay', '/tai-khoan', '/xep-trinh-do']) {
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
    expect(location.origin).toBe(FAKE_SUPABASE_URL);
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
