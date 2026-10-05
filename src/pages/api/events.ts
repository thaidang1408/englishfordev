import type { APIRoute } from 'astro';
import { publicEnv } from '../../lib/env';
import { handleEvent } from '../../lib/events/handler';
import { errors } from '../../lib/http/response';

export const prerender = false;

export const ALL: APIRoute = async ({ request, locals }) => {
  try {
    return await handleEvent({
      request,
      user: locals.user,
      siteUrl: publicEnv().PUBLIC_SITE_URL,
      repo: {
        async insert(row) {
          const { error } = await locals.supabase.from('events').insert(row);
          if (error) throw new Error(error.message);
        },
      },
    });
  } catch (e) {
    console.error('[api/events]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
