import type { APIRoute } from 'astro';
import { publicEnv } from '../../../lib/env';
import { errors } from '../../../lib/http/response';
import { handleCreateOrder } from '../../../lib/pay/handlers';
import { payDeps } from '../../../lib/pay/server';

export const prerender = false;

export const ALL: APIRoute = async ({ request, locals, url }) => {
  try {
    const { repo, payos } = payDeps(locals.supabase);
    if (!repo) {
      console.error('[api/orders] thiếu SUPABASE_SERVICE_ROLE_KEY');
      return errors.internal();
    }
    return await handleCreateOrder({
      request,
      user: locals.user,
      repo,
      payos,
      now: new Date(),
      siteUrl: publicEnv().PUBLIC_SITE_URL,
      origin: url.origin,
    });
  } catch (e) {
    console.error('[api/orders]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
