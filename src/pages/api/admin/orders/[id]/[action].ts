import type { APIRoute } from 'astro';
import { publicEnv } from '../../../../../lib/env';
import { errors } from '../../../../../lib/http/response';
import { handleAdminOrder } from '../../../../../lib/pay/handlers';
import { payDeps } from '../../../../../lib/pay/server';

export const prerender = false;

/** POST /api/admin/orders/:id/confirm và /api/admin/orders/:id/refund (SPEC mục 3). */
export const ALL: APIRoute = async ({ request, locals, params }) => {
  try {
    const { repo, adminEmails } = payDeps(locals.supabase);
    if (!repo) return errors.internal();
    return await handleAdminOrder({
      request,
      user: locals.user,
      repo,
      now: new Date(),
      siteUrl: publicEnv().PUBLIC_SITE_URL,
      action: params.action,
      orderId: params.id,
      adminEmails,
    });
  } catch (e) {
    console.error('[api/admin/orders]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
