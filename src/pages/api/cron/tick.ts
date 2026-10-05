import type { APIRoute } from 'astro';
import { lessons } from '../../../lib/content/lessons';
import { tickRepo } from '../../../lib/db/notify';
import { createServiceDb } from '../../../lib/db/service';
import { publicEnv } from '../../../lib/env';
import { serverEnv } from '../../../lib/env-server';
import { errors } from '../../../lib/http/response';
import { handleTick } from '../../../lib/notify/tick';
import { telegramBot } from '../../../lib/telegram/bot';

export const prerender = false;

// Gọi bởi worker cron (cron/) qua service binding, xác thực bằng CRON_SECRET.
export const ALL: APIRoute = async ({ request, url }) => {
  try {
    const env = serverEnv();
    return await handleTick({
      request,
      secret: env.CRON_SECRET ?? null,
      bot: env.TELEGRAM_BOT_TOKEN ? telegramBot(env.TELEGRAM_BOT_TOKEN) : null,
      repo: env.SUPABASE_SERVICE_ROLE_KEY ? tickRepo(createServiceDb(env.SUPABASE_SERVICE_ROLE_KEY)) : null,
      lessons,
      now: new Date(),
      site: (publicEnv().PUBLIC_SITE_URL ?? url.origin).replace(/\/$/, ''),
    });
  } catch (e) {
    console.error('[api/cron/tick]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
