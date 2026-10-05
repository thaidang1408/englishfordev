import type { APIRoute } from 'astro';
import { safeNext } from '../../lib/auth/redirect';
import { getProfile } from '../../lib/db/queries';

export const prerender = false;

/** Google hoặc GitHub chuyển về đây kèm `code`. Đổi code lấy session rồi chuyển tiếp. */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get('code');
  if (!code) return redirect('/dang-nhap?loi=1', 303);

  const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error('[auth/callback]', error?.message ?? 'không có người dùng');
    return redirect('/dang-nhap?loi=1', 303);
  }

  // Lần đăng nhập đầu: làm test xếp trình độ trước.
  const profile = await getProfile(locals.supabase, data.user.id);
  if (!profile?.level) return redirect('/xep-trinh-do', 303);
  return redirect(safeNext(url.searchParams.get('next')), 303);
};
