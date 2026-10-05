import type { APIRoute } from 'astro';
import { errors } from '../../../lib/http/response';
import { handlePayosWebhook } from '../../../lib/pay/handlers';
import { payDeps } from '../../../lib/pay/server';

export const prerender = false;

// Gọi từ máy chủ payOS, không có cookie người dùng. Xác thực bằng chữ ký HMAC trong body.
export const ALL: APIRoute = async ({ request, locals }) => {
  try {
    const { repo, checksumKey } = payDeps(locals.supabase);
    if (!repo) return errors.internal();
    return await handlePayosWebhook({ request, repo, checksumKey });
  } catch (e) {
    console.error('[api/payos/webhook]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
