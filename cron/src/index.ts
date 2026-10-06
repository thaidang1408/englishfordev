/**
 * Worker cron (SPEC mục 9): mỗi 15 phút gọi POST /api/cron/tick của app kèm CRON_SECRET.
 * Gọi qua service binding APP, vì Cloudflare chặn worker gọi worker khác cùng tài khoản qua địa chỉ workers.dev.
 * Mọi việc (nhắc, báo cáo tuần, giữ Supabase không tạm dừng) nằm ở app; worker này chỉ bấm giờ.
 * Tick lỗi thì báo thẳng qua Telegram Bot API (app có thể đang sập nên không đi qua app),
 * khi có secret TELEGRAM_BOT_TOKEN và ADMIN_CHAT_IDS (số chat, cách nhau bằng dấu phẩy).
 */
type Fetcher = { fetch(input: string, init?: RequestInit): Promise<Response> };
type Env = { APP: Fetcher; CRON_SECRET?: string; TELEGRAM_BOT_TOKEN?: string; ADMIN_CHAT_IDS?: string };
type ScheduledController = { scheduledTime: number; cron: string };
type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };

/** Báo admin qua Telegram. Không bao giờ ném lỗi, không ghi token vào log. */
export async function alert(env: Env, text: string, fetcher: typeof fetch = fetch): Promise<void> {
  const ids = (env.ADMIN_CHAT_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!env.TELEGRAM_BOT_TOKEN || ids.length === 0) return;
  await Promise.all(
    ids.map((id) =>
      fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text: `[EPC cảnh báo] ${text}` }),
      }).catch(() => console.error('[cron] gửi cảnh báo lỗi kết nối')),
    ),
  );
}

export async function tick(env: Env, fetcher: typeof fetch = fetch): Promise<void> {
  if (!env.CRON_SECRET) {
    console.error('[cron] thiếu CRON_SECRET');
    return;
  }
  try {
    // Host chỉ để tạo URL hợp lệ; service binding luôn chuyển tới worker epc-app.
    const res = await env.APP.fetch('https://epc-app/api/cron/tick', {
      method: 'POST',
      // Content-Type JSON: Astro chặn POST khác nguồn có kiểu form hoặc không có Content-Type (checkOrigin).
      headers: { Authorization: `Bearer ${env.CRON_SECRET}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    const body = await res.text();
    if (res.ok) {
      console.log(`[cron] tick ${body.slice(0, 200)}`);
      return;
    }
    console.error(`[cron] tick lỗi ${res.status}: ${body.slice(0, 200)}`);
    await alert(env, `Cron tick lỗi ${res.status}. Xem log Cloudflare của epc-app.`, fetcher);
  } catch (e) {
    console.error('[cron] không gọi được app:', e instanceof Error ? e.message : 'lỗi không rõ');
    await alert(env, 'Cron không gọi được app (epc-app có thể đang sập).', fetcher);
  }
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(tick(env));
  },
  // Không nhận request từ ngoài.
  async fetch(): Promise<Response> {
    return new Response('Not found', { status: 404 });
  },
};
