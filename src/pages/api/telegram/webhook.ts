import type { APIRoute } from 'astro';
import { env as cf } from 'cloudflare:workers';
import { createCorrector, isWorkersAi } from '../../../lib/ai/correct';
import { runCorrection } from '../../../lib/correct/handler';
import { correctRepo } from '../../../lib/db/corrections';
import { telegramRepo } from '../../../lib/db/notify';
import { createServiceDb } from '../../../lib/db/service';
import { serverEnv } from '../../../lib/env-server';
import { errors } from '../../../lib/http/response';
import { alertAdmins, alertCapHit } from '../../../lib/notify/alert';
import { telegramBot } from '../../../lib/telegram/bot';
import { handleTelegramWebhook } from '../../../lib/telegram/webhook';

export const prerender = false;

// Gọi từ máy chủ Telegram, xác thực bằng header X-Telegram-Bot-Api-Secret-Token.
export const ALL: APIRoute = async ({ request, locals }) => {
  try {
    const env = serverEnv();
    const service = env.SUPABASE_SERVICE_ROLE_KEY ? createServiceDb(env.SUPABASE_SERVICE_ROLE_KEY) : null;
    const ai = createCorrector({ apiKey: env.ANTHROPIC_API_KEY, ai: isWorkersAi(cf.AI) ? cf.AI : undefined, model: env.AI_MODEL });
    // Không có session người dùng: đọc và ghi bằng service role, luôn lọc theo user_id của chat đã liên kết.
    const correctFor =
      service && ai
        ? (userId: string, sentence: string) =>
            runCorrection({
              userId,
              sentence,
              mode: 'work',
              repo: correctRepo(service, service),
              correct: ai.correct,
              model: ai.model,
              now: new Date(),
              dailyCap: env.AI_DAILY_CALL_CAP,
              onCapHit: () => locals.cfContext.waitUntil(alertCapHit()),
            })
        : null;
    return await handleTelegramWebhook({
      request,
      secret: env.TELEGRAM_WEBHOOK_SECRET ?? null,
      bot: env.TELEGRAM_BOT_TOKEN ? telegramBot(env.TELEGRAM_BOT_TOKEN) : null,
      repo: service ? telegramRepo(service, env.ADMIN_EMAILS) : null,
      correctFor,
      defer: (work) => locals.cfContext.waitUntil(work),
    });
  } catch (e) {
    console.error('[api/telegram/webhook]', e instanceof Error ? e.message : 'lỗi không rõ');
    await alertAdmins('Lỗi 500 ở /api/telegram/webhook. Xem log Cloudflare.');
    return errors.internal();
  }
};
