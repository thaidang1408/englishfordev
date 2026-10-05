import type { APIRoute } from 'astro';
import { lessons } from '../../lib/content/lessons';
import { progressRepo } from '../../lib/db/queries';
import { publicEnv } from '../../lib/env';
import { errors } from '../../lib/http/response';
import { handleProgress } from '../../lib/progress/handler';

export const prerender = false;

export const ALL: APIRoute = async ({ request, locals }) => {
  try {
    return await handleProgress({
      request,
      user: locals.user,
      repo: progressRepo(locals.supabase),
      lessons,
      now: new Date(),
      siteUrl: publicEnv().PUBLIC_SITE_URL,
    });
  } catch (e) {
    console.error('[api/progress]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
