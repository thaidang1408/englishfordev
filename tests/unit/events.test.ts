import { describe, expect, it } from 'vitest';
import { handleEvent, type EventRepo } from '../../src/lib/events/handler';

const SITE = 'https://epc.test';
const ANON = '3f2a9c1e-0b7d-4e55-9a61-2c8d7f0e4b12';

function fakeRepo() {
  const rows: Parameters<EventRepo['insert']>[0][] = [];
  return { rows, repo: { insert: async (r) => void rows.push(r) } satisfies EventRepo };
}

const post = (body: unknown, opts: { origin?: string | null; method?: string; raw?: string } = {}) =>
  new Request(`${SITE}/api/events`, {
    method: opts.method ?? 'POST',
    headers: opts.origin === null ? {} : { Origin: opts.origin ?? SITE, 'Content-Type': 'application/json' },
    body: opts.method === 'GET' ? undefined : (opts.raw ?? JSON.stringify(body)),
  });

describe('POST /api/events', () => {
  it('khách ghi được sự kiện, không gắn người dùng', async () => {
    const { rows, repo } = fakeRepo();
    const res = await handleEvent({
      request: post({ name: 'lesson_start', anon_id: ANON, props: { lesson_key: 'standup-01', src: 'fb' } }),
      user: null,
      repo,
      siteUrl: SITE,
    });
    expect(res.status).toBe(204);
    expect(rows).toEqual([{ user_id: null, anon_id: ANON, name: 'lesson_start', props: { lesson_key: 'standup-01', src: 'fb' } }]);
  });

  it('user_id lấy từ session ở server', async () => {
    const { rows, repo } = fakeRepo();
    await handleEvent({ request: post({ name: 'page_view', anon_id: ANON }), user: { id: 'u1' }, repo, siteUrl: SITE });
    expect(rows[0]).toMatchObject({ user_id: 'u1', props: {} });
  });

  it('không nhận sự kiện chỉ server được ghi, tên lạ, props lạ hoặc câu của người dùng', async () => {
    const { rows, repo } = fakeRepo();
    const bodies = [
      { name: 'order_paid', anon_id: ANON },
      { name: 'signup', anon_id: ANON },
      { name: 'hacked', anon_id: ANON },
      { name: 'page_view', anon_id: 'x' },
      { name: 'page_view', anon_id: ANON, props: { sentence: 'I fixed bug' } },
      { name: 'page_view', anon_id: ANON, props: { lesson_key: 'standup-1; drop' } },
      { name: 'page_view', anon_id: ANON, user_id: 'u2' },
    ];
    for (const b of bodies) {
      expect((await handleEvent({ request: post(b), user: null, repo, siteUrl: SITE })).status).toBe(400);
    }
    expect((await handleEvent({ request: post(null, { raw: '{' }), user: null, repo, siteUrl: SITE })).status).toBe(400);
    expect((await handleEvent({ request: post(null, { raw: 'x'.repeat(2000) }), user: null, repo, siteUrl: SITE })).status).toBe(400);
    expect(rows).toHaveLength(0);
  });

  it('chặn sai phương thức và sai nguồn', async () => {
    const { rows, repo } = fakeRepo();
    const body = { name: 'page_view', anon_id: ANON };
    expect((await handleEvent({ request: post(body, { method: 'GET' }), user: null, repo, siteUrl: SITE })).status).toBe(405);
    expect((await handleEvent({ request: post(body, { origin: 'https://evil.test' }), user: null, repo, siteUrl: SITE })).status).toBe(403);
    expect((await handleEvent({ request: post(body, { origin: null }), user: null, repo, siteUrl: SITE })).status).toBe(403);
    expect(rows).toHaveLength(0);
  });
});

describe('giới hạn theo IP', () => {
  it('vượt giới hạn thì 429 và không ghi, khóa là IP', async () => {
    const { rows, repo } = fakeRepo();
    const keys: string[] = [];
    const req = () => {
      const r = post({ name: 'page_view', anon_id: ANON });
      r.headers.set('CF-Connecting-IP', '1.2.3.4');
      return r;
    };
    let allow = true;
    const limit = async (k: string) => (keys.push(k), allow);
    expect((await handleEvent({ request: req(), user: null, repo, siteUrl: SITE, limit })).status).toBe(204);
    allow = false;
    expect((await handleEvent({ request: req(), user: null, repo, siteUrl: SITE, limit })).status).toBe(429);
    expect(keys).toEqual(['1.2.3.4', '1.2.3.4']);
    expect(rows).toHaveLength(1);
  });
});
