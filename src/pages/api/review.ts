import type { APIRoute } from 'astro';
import { lessons } from '../../lib/content/lessons';
import { reviewRepo } from '../../lib/db/queries';
import { publicEnv } from '../../lib/env';
import { errors } from '../../lib/http/response';
import { handleReview } from '../../lib/review/handler';

export const prerender = false;

export const ALL: APIRoute = async ({ request, locals }) => {
  try {
    return await handleReview({
      request,
      user: locals.user,
      repo: reviewRepo(locals.supabase),
      lessons,
      now: new Date(),
      siteUrl: publicEnv().PUBLIC_SITE_URL,
    });
  } catch (e) {
    console.error('[api/review]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
