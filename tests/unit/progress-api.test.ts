import { describe, expect, it } from 'vitest';
import { lessons } from '../../src/lib/content/lessons';
import type { Lesson } from '../../src/lib/content/schema';
import type { EntitlementRow, LessonProgressRow } from '../../src/lib/db/types';
import { handleProgress, type ProgressRepo } from '../../src/lib/progress/handler';

const NOW = new Date('2026-10-05T01:00:00Z');
const SITE = 'https://epc.example';
const USER = { id: 'user-a' };

// Bài trả phí giả để kiểm khóa Premium.
const base = lessons[0]!;
const paid: Lesson = { ...base, id: 4, slug: 'bai-tra-phi', free: false, quiz: base.quiz.map((q, i) => ({ ...q, id: `s04q${i + 1}` })) };
const ALL = [...lessons, paid];

function fakeRepo(ent: EntitlementRow | null, lessonRow: LessonProgressRow | null = null) {
  const saved = { lessons: [] as unknown[], reviews: [] as unknown[] };
  const repo: ProgressRepo = {
    getEntitlement: async () => ent,
    getLesson: async () => lessonRow,
    saveLessons: async (rows) => void saved.lessons.push(...rows),
    saveReviews: async (rows) => void saved.reviews.push(...rows),
  };
  return { repo, saved };
}

const trial: EntitlementRow = { user_id: USER.id, premium_until: null, trial_until: '2026-10-12T00:00:00Z' };
const expired: EntitlementRow = { user_id: USER.id, premium_until: null, trial_until: '2026-10-01T00:00:00Z' };

function post(body: unknown, init: { origin?: string | null; method?: string } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (init.origin !== null) headers.set('Origin', init.origin ?? SITE);
  return new Request(`${SITE}/api/progress`, {
    method: init.method ?? 'POST',
    headers,
    body: init.method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const guestProgress = {
  'standup-01': {
    answers: { s01q1: true, s01q2: false, s01q3: true, s01q4: true, s01q5: false },
    completed_at: '2026-10-04T02:00:00.000Z',
  },
  'standup-02': { answers: { s02q1: false } },
};

async function run(request: Request, ent: EntitlementRow | null = trial, user: { id: string } | null = USER) {
  const { repo, saved } = fakeRepo(ent);
  const res = await handleProgress({ request, user, repo, lessons: ALL, now: NOW, siteUrl: SITE });
  return { res, json: (await res.json()) as { ok: boolean; error?: { code: string } }, saved };
}

describe('POST /api/progress', () => {
  it('405 khi không phải GET hay POST', async () => {
    const { res } = await run(new Request(`${SITE}/api/progress`, { method: 'PUT', headers: { Origin: SITE }, body: '{}' }));
    expect(res.status).toBe(405);
  });

  it('403 khi không có Origin hoặc Origin lạ', async () => {
    expect((await run(post({ progress: {} }, { origin: null }))).res.status).toBe(403);
    expect((await run(post({ progress: {} }, { origin: 'https://evil.example' }))).res.status).toBe(403);
  });

  it('401 khi chưa đăng nhập, không ghi gì', async () => {
    const { res, saved } = await run(post({ progress: guestProgress }), trial, null);
    expect(res.status).toBe(401);
    expect(saved).toEqual({ lessons: [], reviews: [] });
  });

  it('400 khi body không phải JSON, sai dạng, hoặc có câu hỏi không tồn tại', async () => {
    expect((await run(post('{hỏng'))).res.status).toBe(400);
    expect((await run(post({ progress: { 'standup-01': { answers: 'x' } } }))).res.status).toBe(400);
    expect((await run(post({ progress: { 'standup-01': { answers: { s02q1: true } } } }))).res.status).toBe(400);
    expect((await run(post({ progress: { 'standup-09': { answers: {} } } }))).res.status).toBe(400);
  });

  it('403 khi tài khoản hết dùng thử gửi tiến độ bài trả phí', async () => {
    const body = { progress: { 'standup-04': { answers: { s04q1: true } } } };
    const { res, json, saved } = await run(post(body), expired);
    expect(res.status).toBe(403);
    expect(json.error?.code).toBe('forbidden');
    expect(saved.lessons).toEqual([]);
  });

  it('đang dùng thử thì lưu được bài trả phí', async () => {
    const body = { progress: { 'standup-04': { answers: { s04q1: true } } } };
    expect((await run(post(body), trial)).res.status).toBe(200);
  });

  it('lưu bài đã xong và tạo mục ôn cho mỗi câu sai, hạn ôn sau 1 ngày', async () => {
    const { res, saved } = await run(post({ progress: guestProgress }), expired);
    expect(res.status).toBe(200);
    expect(saved.lessons).toEqual([
      { user_id: USER.id, lesson_key: 'standup-01', score: 3, completed_at: '2026-10-04T02:00:00.000Z' },
    ]);
    expect(saved.reviews).toEqual(
      ['s01q2', 's01q5', 's02q1'].map((ref) => ({
        user_id: USER.id,
        kind: 'quiz',
        lesson_key: ref.startsWith('s01') ? 'standup-01' : 'standup-02',
        ref,
        box: 1,
        due_at: '2026-10-06T01:00:00.000Z',
      })),
    );
  });

  it('không nhận user_id từ body', async () => {
    const { saved } = await run(post({ progress: guestProgress, user_id: 'user-b' }));
    expect(saved.lessons.every((r) => (r as { user_id: string }).user_id === USER.id)).toBe(true);
  });

  it('thời điểm học xong ở tương lai bị kéo về hiện tại', async () => {
    const body = { progress: { 'standup-01': { answers: {}, completed_at: '2030-01-01T00:00:00.000Z' } } };
    const { saved } = await run(post(body));
    expect((saved.lessons[0] as { completed_at: string }).completed_at).toBe(NOW.toISOString());
  });
});

describe('GET /api/progress', () => {
  const get = (lesson: string) => new Request(`${SITE}/api/progress?lesson=${lesson}`);
  async function runGet(request: Request, user: { id: string } | null, row: LessonProgressRow | null = null) {
    const { repo } = fakeRepo(trial, row);
    const res = await handleProgress({ request, user, repo, lessons: ALL, now: NOW, siteUrl: SITE });
    return { res, json: (await res.json()) as { data?: unknown } };
  }

  it('401 khi chưa đăng nhập, để trang bài học biết dùng tiến độ trên trình duyệt', async () => {
    expect((await runGet(get('standup-01'), null)).res.status).toBe(401);
  });

  it('400 khi không có bài đó', async () => {
    expect((await runGet(get('standup-99'), USER)).res.status).toBe(400);
  });

  it('trả kết quả đã lưu của tài khoản, hoặc null khi chưa học', async () => {
    const row = { user_id: USER.id, lesson_key: 'standup-01', score: 4, completed_at: '2026-10-04T02:00:00.000Z' };
    expect((await runGet(get('standup-01'), USER, row)).json.data).toEqual({
      lesson_key: 'standup-01',
      completed: { score: 4, completed_at: '2026-10-04T02:00:00.000Z' },
    });
    expect((await runGet(get('standup-01'), USER)).json.data).toEqual({ lesson_key: 'standup-01', completed: null });
  });
});
