import type { APIRoute } from 'astro';
import { z } from 'zod';
import { safeNext } from '../../lib/auth/redirect';
import { publicEnv } from '../../lib/env';
import { sameOrigin } from '../../lib/http/response';

export const prerender = false;

const formSchema = z.object({ provider: z.enum(['google', 'github']), next: z.string().max(200).optional() });

/** POST từ form ở /dang-nhap: bắt đầu đăng nhập OAuth (PKCE), mã xác minh lưu trong cookie. */
export const POST: APIRoute = async ({ request, locals, url, redirect }) => {
  if (!sameOrigin(request, publicEnv().PUBLIC_SITE_URL)) return redirect('/dang-nhap?loi=1', 303);

  const form = formSchema.safeParse(Object.fromEntries(await request.formData()));
  if (!form.success) return redirect('/dang-nhap?loi=1', 303);

  const callback = new URL('/auth/callback', url.origin);
  callback.searchParams.set('next', safeNext(form.data.next));

  const { data, error } = await locals.supabase.auth.signInWithOAuth({
    provider: form.data.provider,
    options: { redirectTo: callback.href },
  });
  if (error || !data.url) {
    console.error('[auth/signin]', error?.message ?? 'không có url');
    return redirect('/dang-nhap?loi=1', 303);
  }
  return redirect(data.url, 303);
};
