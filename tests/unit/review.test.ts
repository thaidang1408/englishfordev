import { describe, expect, it } from 'vitest';
import { lessons } from '../../src/lib/content/lessons';
import { handleReview, type ReviewRepo } from '../../src/lib/review/handler';
import { LEARNED_BOX, nextState, pickSession } from '../../src/lib/review/leitner';

const NOW = new Date('2026-10-05T01:00:00Z');
const inDays = (d: number) => new Date(NOW.getTime() + d * 86_400_000).toISOString();

describe('luật Leitner', () => {
  it.each([
    [1, 2, 3],
    [2, 3, 7],
    [3, 4, 14],
  ])('đúng ở mức %i thì lên mức %i, ôn lại sau %i ngày', (box, nextBox, days) => {
    expect(nextState(box, true, NOW)).toEqual({ box: nextBox, due_at: inDays(days) });
  });

  it('đúng ở mức 14 ngày thì coi như đã thuộc', () => {
    expect(nextState(4, true, NOW).box).toBe(LEARNED_BOX);
  });

  it.each([1, 2, 3, 4])('sai ở mức %i thì về mức 1, ôn lại ngày mai', (box) => {
    expect(nextState(box, false, NOW)).toEqual({ box: 1, due_at: inDays(1) });
  });
});

describe('chọn phiên ôn', () => {
  const item = (id: string, box: number, due: number) => ({ id, box, due_at: inDays(due) });

  it('chỉ lấy mục đến hạn và chưa thuộc, quá hạn lâu nhất lên trước', () => {
    const items = [item('a', 1, -1), item('b', 2, -5), item('c', 1, 1), item('d', 5, -9), item('e', 3, 0)];
    expect(pickSession(items, NOW).map((i) => i.id)).toEqual(['b', 'a', 'e']);
  });

  it('tối đa 10 mục', () => {
    const items = Array.from({ length: 14 }, (_, i) => item(`x${i}`, 1, -i));
    const session = pickSession(items, NOW);
    expect(session).toHaveLength(10);
    expect(session[0]?.id).toBe('x13');
  });
});

describe('POST /api/review', () => {
  const SITE = 'https://epc.example';
  const ITEM_ID = '7b0c6a43-4c1e-4a43-9a3a-2f0f1b9f1a01';
  const lesson = lessons[0]!;
  const quiz = lesson.quiz[1]!;

  type Item = NonNullable<Awaited<ReturnType<ReviewRepo['getItem']>>>;
  const dueItem: Item = { id: ITEM_ID, kind: 'quiz', lesson_key: 'standup-01', ref: quiz.id, box: 2, due_at: inDays(-1) };

  function setup(item: Item | null, changed = 1) {
    const updates: unknown[] = [];
    const repo: ReviewRepo = {
      getItem: async () => item,
      updateItem: async (id, fromBox, next) => {
        updates.push({ id, fromBox, next });
        return changed;
      },
    };
    return { repo, updates };
  }

  const post = (body: unknown, origin: string | null = SITE) =>
    new Request(`${SITE}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
      body: JSON.stringify(body),
    });

  async function run(request: Request, item: Item | null = dueItem, user: { id: string } | null = { id: 'u' }, changed = 1) {
    const { repo, updates } = setup(item, changed);
    const res = await handleReview({ request, user, repo, lessons, now: NOW, siteUrl: SITE });
    return { res, json: (await res.json()) as { ok: boolean; data?: { correct: boolean; box: number }; error?: { code: string } }, updates };
  }

  it('401 khi chưa đăng nhập', async () => {
    expect((await run(post({ item_id: ITEM_ID, choice: 0 }), dueItem, null)).res.status).toBe(401);
  });

  it('403 khi Origin lạ', async () => {
    expect((await run(post({ item_id: ITEM_ID, choice: 0 }, 'https://evil.example'))).res.status).toBe(403);
  });

  it('400 khi body sai', async () => {
    expect((await run(post({ item_id: 'x', choice: 0 }))).res.status).toBe(400);
    expect((await run(post({ item_id: ITEM_ID, choice: 3 }))).res.status).toBe(400);
    expect((await run(post({ item_id: ITEM_ID, correct: true }))).res.status).toBe(400);
  });

  it('404 khi mục ôn không phải của mình (RLS trả về rỗng)', async () => {
    expect((await run(post({ item_id: ITEM_ID, choice: 0 }), null)).res.status).toBe(404);
  });

  it('409 khi mục chưa đến hạn hoặc vừa được chấm ở tab khác', async () => {
    const notDue = { ...dueItem, due_at: inDays(2) };
    const a = await run(post({ item_id: ITEM_ID, choice: 0 }), notDue);
    expect(a.res.status).toBe(409);
    expect(a.updates).toEqual([]);
    expect((await run(post({ item_id: ITEM_ID, choice: 0 }), dueItem, { id: 'u' }, 0)).res.status).toBe(409);
  });

  it('server tự chấm: chọn đáp án gốc 0 là đúng, lên một mức', async () => {
    const { res, json, updates } = await run(post({ item_id: ITEM_ID, choice: 0 }));
    expect(res.status).toBe(200);
    expect(json.data).toMatchObject({ correct: true, box: 3 });
    expect(updates).toEqual([{ id: ITEM_ID, fromBox: 2, next: { box: 3, due_at: inDays(7) } }]);
  });

  it('chọn sai thì về mức 1', async () => {
    const { json, updates } = await run(post({ item_id: ITEM_ID, choice: 2 }));
    expect(json.data).toMatchObject({ correct: false, box: 1 });
    expect(updates).toEqual([{ id: ITEM_ID, fromBox: 2, next: { box: 1, due_at: inDays(1) } }]);
  });
});
