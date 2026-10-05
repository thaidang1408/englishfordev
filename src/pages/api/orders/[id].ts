import type { APIRoute } from 'astro';
import { publicEnv } from '../../../lib/env';
import { errors } from '../../../lib/http/response';
import { handleGetOrder } from '../../../lib/pay/handlers';
import { payDeps } from '../../../lib/pay/server';

export const prerender = false;

export const ALL: APIRoute = async ({ request, locals, params }) => {
  try {
    const { repo, payos } = payDeps(locals.supabase);
    if (!repo) return errors.internal();
    return await handleGetOrder({
      request,
      user: locals.user,
      repo,
      payos,
      now: new Date(),
      siteUrl: publicEnv().PUBLIC_SITE_URL,
      orderId: params.id,
    });
  } catch (e) {
    console.error('[api/orders/:id]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
