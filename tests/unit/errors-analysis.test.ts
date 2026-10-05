import { describe, expect, it } from 'vitest';
import type { Change, ErrorCategory } from '../../src/lib/ai/schema';
import { lessons } from '../../src/lib/content/lessons';
import type { Lesson } from '../../src/lib/content/schema';
import { countByCategory, pickInterviewQuestions } from '../../src/lib/interview/session';
import { quotaFor } from '../../src/lib/correct/quota';
import { flattenErrors, topCategories, totalErrors, weeklyTrend, type ErrorEntry } from '../../src/lib/stats/errors';
import { vnStartOfDay } from '../../src/lib/time';

const NOW = new Date('2026-10-05T03:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

const change = (category: ErrorCategory, from = 'x'): Change => ({ from, to: 'y', why_vi: 'Lý do.', category });
const entry = (d: number, ...changes: Change[]): ErrorEntry => ({
  created_at: daysAgo(d),
  original: `câu ${d}`,
  result: { is_already_correct: changes.length === 0, corrected: 'c', changes, tip_vi: '' },
});

describe('phân tích lỗi', () => {
  const entries = [
    entry(1, change('article', 'a1'), change('tense')),
    entry(3, change('article', 'a3')),
    entry(9, change('article', 'a9'), change('preposition')),
    entry(10, change('preposition'), change('preposition')),
    entry(12, change('tense')),
    entry(20, change('word_order')),
    entry(40, change('plural'), change('plural'), change('plural')),
    entry(2),
  ];

  it('tổng số lỗi là tổng số chỗ sửa', () => {
    expect(totalErrors(entries)).toBe(12);
  });

  it('ba nhóm hay mắc nhất trong 28 ngày, ví dụ là lỗi gần nhất của nhóm đó', () => {
    const top = topCategories(entries, NOW);
    expect(top.map((t) => [t.category, t.count])).toEqual([
      ['article', 3],
      ['preposition', 3],
      ['tense', 2],
    ]);
    expect(top[0]?.example).toMatchObject({ from: 'a1', original: 'câu 1' });
    // Lỗi số nhiều 40 ngày trước không tính dù nhiều nhất.
    expect(top.some((t) => t.category === 'plural')).toBe(false);
  });

  it('so 7 ngày qua với 7 ngày trước: tăng, giảm, giữ nguyên', () => {
    const w = Object.fromEntries(weeklyTrend(entries, NOW).map((r) => [r.category, r]));
    expect(w.article).toMatchObject({ thisWeek: 2, lastWeek: 1, trend: 'up' });
    expect(w.preposition).toMatchObject({ thisWeek: 0, lastWeek: 3, trend: 'down' });
    expect(w.tense).toMatchObject({ thisWeek: 1, lastWeek: 1, trend: 'same' });
    expect(w.word_order).toBeUndefined();
  });

  it('danh sách lỗi xếp mới nhất trước', () => {
    expect(flattenErrors(entries).map((e) => e.original).slice(0, 3)).toEqual(['câu 1', 'câu 1', 'câu 3']);
  });
});

describe('hạn mức theo thời gian', () => {
  it('"hôm nay" bắt đầu từ 0 giờ giờ Việt Nam', () => {
    expect(vnStartOfDay(new Date('2026-10-05T03:00:00Z')).toISOString()).toBe('2026-10-04T17:00:00.000Z');
    expect(vnStartOfDay(new Date('2026-10-04T18:00:00Z')).toISOString()).toBe('2026-10-04T17:00:00.000Z');
  });

  it('tài khoản miễn phí đếm 7 ngày gần nhất, dùng thử và Premium đếm trong ngày', () => {
    expect(quotaFor({ kind: 'free', trialEndedAt: null }, NOW)).toEqual({ kind: 'free', limit: 1, since: new Date(daysAgo(7)) });
    expect(quotaFor({ kind: 'trial', until: NOW }, NOW)).toMatchObject({ limit: 10, since: vnStartOfDay(NOW) });
    expect(quotaFor({ kind: 'premium', until: NOW }, NOW)).toMatchObject({ limit: 30, since: vnStartOfDay(NOW) });
  });
});

describe('phỏng vấn thử', () => {
  const make = (id: number): Lesson => ({
    ...lessons[0]!,
    id,
    track: 'interview',
    slug: `pv-${id}`,
    free: false,
    question_en: `Question ${id}?`,
  });
  const pool = Array.from({ length: 8 }, (_, i) => make(i + 1));

  it('5 câu, không trùng, bài đã học lên trước', () => {
    const done = new Set(['interview-07', 'interview-02']);
    const qs = pickInterviewQuestions([...lessons, ...pool], done, () => 0.42);
    expect(qs).toHaveLength(5);
    expect(new Set(qs.map((q) => q.question)).size).toBe(5);
    expect(qs.slice(0, 2).map((q) => q.lessonKey).sort()).toEqual(['interview-02', 'interview-07']);
  });

  it('chỉ lấy câu hỏi của track Phỏng vấn; chưa có bài thì không có câu', () => {
    expect(pickInterviewQuestions(lessons, new Set())).toEqual([]);
  });

  it('tổng kết đếm chỗ sửa theo nhóm, nhiều nhất trước', () => {
    expect(countByCategory([change('tense'), change('article'), change('tense')])).toEqual([
      { category: 'tense', count: 2 },
      { category: 'article', count: 1 },
    ]);
  });
});
