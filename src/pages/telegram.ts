import type { APIRoute } from 'astro';
import { getProfile } from '../lib/db/queries';
import { serverEnv } from '../lib/env-server';
import { startLink } from '../lib/telegram/bot';

export const prerender = false;

/**
 * Nút Telegram nổi ở mọi trang (SPEC mục 14) trỏ về đây. Đã đăng nhập mà chưa liên kết thì mở bot kèm mã
 * liên kết, bấm Start là xong; còn lại mở chat với bot. Bot chưa cấu hình thì về trang Tài khoản.
 */
export const GET: APIRoute = async ({ locals, redirect }) => {
  const bot = serverEnv().TELEGRAM_BOT_USERNAME;
  if (!bot) return redirect('/tai-khoan#telegram', 302);
  let href = `https://t.me/${encodeURIComponent(bot)}`;
  if (locals.user) {
    const profile = await getProfile(locals.supabase, locals.user.id).catch(() => null);
    if (profile && profile.telegram_chat_id == null && profile.telegram_link_token) href = startLink(bot, profile.telegram_link_token);
  }
  // Link có mã liên kết riêng của tài khoản: không cho cache.
  return new Response(null, { status: 302, headers: { Location: href, 'Cache-Control': 'no-store' } });
};
