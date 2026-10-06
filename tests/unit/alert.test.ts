import { describe, expect, it } from 'vitest';
import { alert, tick } from '../../cron/src/index';
import { alertAdmins, alertCapHit } from '../../src/lib/notify/alert';

describe('cảnh báo admin', () => {
  it('chạm trần AI: tối đa một tin mỗi ngày giờ Việt Nam (cùng mốc reset trần)', async () => {
    const sent: string[] = [];
    const send = async (t: string) => void sent.push(t);
    await alertCapHit(new Date('2026-10-07T01:00:00Z'), send);
    await alertCapHit(new Date('2026-10-07T16:59:00Z'), send);
    // 17:00 UTC là 00:00 giờ Việt Nam: trần đã reset nên lần chạm mới phải báo.
    await alertCapHit(new Date('2026-10-07T17:01:00Z'), send);
    expect(sent).toHaveLength(2);
  });

  it('alertAdmins không ném lỗi khi thiếu môi trường', async () => {
    await expect(alertAdmins('x')).resolves.toBeUndefined();
  });
});

describe('worker cron', () => {
  const calls: { url: string; body: string }[] = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: String(init?.body) });
    return new Response('{"ok":true}');
  }) as unknown as typeof fetch;
  const env = (status: number | 'down') => ({
    CRON_SECRET: 's'.repeat(16),
    TELEGRAM_BOT_TOKEN: '1:abc',
    ADMIN_CHAT_IDS: '11, 22',
    APP: {
      fetch: async () => {
        if (status === 'down') throw new Error('down');
        return new Response('x', { status });
      },
    },
  });

  it('tick lỗi hoặc app sập: báo mọi chat admin; tick ổn: không báo', async () => {
    calls.length = 0;
    await tick(env(200), fakeFetch);
    expect(calls).toHaveLength(0);
    await tick(env(500), fakeFetch);
    await tick(env('down'), fakeFetch);
    expect(calls).toHaveLength(4);
    expect(calls[0]?.url).toContain('/sendMessage');
    expect(JSON.parse(calls[0]!.body).chat_id).toBe('11');
  });

  it('thiếu secret cảnh báo thì bỏ qua', async () => {
    calls.length = 0;
    await alert({ APP: env(200).APP }, 'x', fakeFetch);
    expect(calls).toHaveLength(0);
  });
});
