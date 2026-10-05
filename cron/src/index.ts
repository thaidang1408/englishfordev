/**
 * Worker cron (SPEC mục 9): mỗi 15 phút gọi POST /api/cron/tick của app kèm CRON_SECRET.
 * Gọi qua service binding APP, vì Cloudflare chặn worker gọi worker khác cùng tài khoản qua địa chỉ workers.dev.
 * Mọi việc (nhắc, báo cáo tuần, giữ Supabase không tạm dừng) nằm ở app; worker này chỉ bấm giờ.
 */
type Fetcher = { fetch(input: string, init?: RequestInit): Promise<Response> };
type Env = { APP: Fetcher; CRON_SECRET?: string };
type ScheduledController = { scheduledTime: number; cron: string };
type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };

async function tick(env: Env): Promise<void> {
  if (!env.CRON_SECRET) {
    console.error('[cron] thiếu CRON_SECRET');
    return;
  }
  // Host chỉ để tạo URL hợp lệ; service binding luôn chuyển tới worker epc-app.
  const res = await env.APP.fetch('https://epc-app/api/cron/tick', {
    method: 'POST',
    // Content-Type JSON: Astro chặn POST khác nguồn có kiểu form hoặc không có Content-Type (checkOrigin).
    headers: { Authorization: `Bearer ${env.CRON_SECRET}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = await res.text();
  if (!res.ok) console.error(`[cron] tick lỗi ${res.status}: ${body.slice(0, 200)}`);
  else console.log(`[cron] tick ${body.slice(0, 200)}`);
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
