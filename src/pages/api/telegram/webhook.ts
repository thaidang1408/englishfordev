import type { APIRoute } from 'astro';
import { telegramRepo } from '../../../lib/db/notify';
import { createServiceDb } from '../../../lib/db/service';
import { serverEnv } from '../../../lib/env-server';
import { errors } from '../../../lib/http/response';
import { telegramBot } from '../../../lib/telegram/bot';
import { handleTelegramWebhook } from '../../../lib/telegram/webhook';

export const prerender = false;

// Gọi từ máy chủ Telegram, xác thực bằng header X-Telegram-Bot-Api-Secret-Token.
export const ALL: APIRoute = async ({ request }) => {
  try {
    const env = serverEnv();
    return await handleTelegramWebhook({
      request,
      secret: env.TELEGRAM_WEBHOOK_SECRET ?? null,
      bot: env.TELEGRAM_BOT_TOKEN ? telegramBot(env.TELEGRAM_BOT_TOKEN) : null,
      repo: env.SUPABASE_SERVICE_ROLE_KEY ? telegramRepo(createServiceDb(env.SUPABASE_SERVICE_ROLE_KEY), env.ADMIN_EMAILS) : null,
    });
  } catch (e) {
    console.error('[api/telegram/webhook]', e instanceof Error ? e.message : 'lỗi không rõ');
    return errors.internal();
  }
};
