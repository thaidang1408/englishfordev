import type { APIRoute } from 'astro';
import { createCorrector } from '../../lib/ai/correct';
import { lessons } from '../../lib/content/lessons';
import { handleCorrect } from '../../lib/correct/handler';
import { correctRepo } from '../../lib/db/corrections';
import { createServiceDb } from '../../lib/db/service';
import { publicEnv } from '../../lib/env';
import { serverEnv } from '../../lib/env-server';
import { errors } from '../../lib/http/response';

export const prerender = false;

export const ALL: APIRoute = async ({ request, locals }) => {
  try {
    const env = serverEnv();
    return await handleCorrect({
      request,
      user: locals.user,
      repo: env.SUPABASE_SERVICE_ROLE_KEY ? correctRepo(locals.supabase, createServiceDb(env.SUPABASE_SERVICE_ROLE_KEY)) : null,
      correct: env.ANTHROPIC_API_KEY ? createCorrector({ apiKey: env.ANTHROPIC_API_KEY, model: env.AI_MODEL }) : null,
      model: env.AI_MODEL,
      lessons,
      now: new Date(),
      dailyCap: env.AI_DAILY_CALL_CAP,
      siteUrl: publicEnv().PUBLIC_SITE_URL,
    });
  } catch (e) {
    // Chỉ ghi thông điệp lỗi, không ghi câu của người dùng.
    console.error('[api/correct]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
