import { defineMiddleware } from 'astro:middleware';
import { createSupabase } from './lib/db/supabase';

/**
 * Chỉ chạy cho trang và endpoint render theo request. Trang prerender không có cookie
 * và không được phụ thuộc vào người dùng.
 */
export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();

  const extra = new Headers();
  const supabase = createSupabase(ctx.request, ctx.cookies, extra);
  ctx.locals.supabase = supabase;

  // getClaims kiểm chữ ký JWT; không tin dữ liệu người dùng từ getSession.
  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims;
  ctx.locals.user = claims?.sub ? { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null } : null;

  const res = await next();
  extra.forEach((v, k) => res.headers.set(k, v));
  // Trang và API theo request đều chứa dữ liệu riêng của người dùng.
  res.headers.set('Cache-Control', 'no-store');
  return res;
});
