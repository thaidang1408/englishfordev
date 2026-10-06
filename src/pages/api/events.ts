import type { APIRoute } from 'astro';
import { env as cf } from 'cloudflare:workers';
import { createServiceDb } from '../../lib/db/service';
import { publicEnv } from '../../lib/env';
import { serverEnv } from '../../lib/env-server';
import { handleEvent, type RateLimit } from '../../lib/events/handler';
import { errors } from '../../lib/http/response';

export const prerender = false;

type Limiter = { limit(o: { key: string }): Promise<{ success: boolean }> };
const isLimiter = (v: unknown): v is Limiter => typeof v === 'object' && v !== null && 'limit' in v && typeof v.limit === 'function';

export const ALL: APIRoute = async ({ request, locals }) => {
  try {
    const key = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
    // Binding EVENTS_LIMIT trong wrangler.jsonc. Không có (test, môi trường lạ) thì không giới hạn.
    const binding = cf.EVENTS_LIMIT;
    const limit: RateLimit | undefined = isLimiter(binding) ? async (k) => (await binding.limit({ key: k })).success : undefined;
    return await handleEvent({
      request,
      user: locals.user,
      siteUrl: publicEnv().PUBLIC_SITE_URL,
      limit,
      repo: {
        async insert(row) {
          // Thiếu service role key (local chưa cấu hình) thì bỏ qua: đo đếm không được làm hỏng trang.
          if (!key) return;
          const { error } = await createServiceDb(key).from('events').insert(row);
          if (error) throw new Error(error.message);
        },
      },
    });
  } catch (e) {
    console.error('[api/events]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
