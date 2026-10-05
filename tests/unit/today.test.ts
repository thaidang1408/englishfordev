import { describe, expect, it } from 'vitest';
import { accessFrom } from '../../src/lib/auth/access';
import { safeNext } from '../../src/lib/auth/redirect';
import { lessons } from '../../src/lib/content/lessons';
import { parseAccountForm } from '../../src/lib/account/form';
import { lessonOfTheDay } from '../../src/lib/lesson/today';
import { buildHeatmap } from '../../src/lib/stats/heatmap';
import { isVnWeekend, vnDateKey } from '../../src/lib/time';

// Thứ Hai 05/10/2026, 08:00 giờ Việt Nam.
const MONDAY = new Date('2026-10-05T01:00:00Z');

describe('giờ Việt Nam', () => {
  it('ngày đổi lúc 0 giờ Việt Nam, không phải 0 giờ UTC', () => {
    expect(vnDateKey(new Date('2026-10-04T16:59:00Z'))).toBe('2026-10-04');
    expect(vnDateKey(new Date('2026-10-04T17:00:00Z'))).toBe('2026-10-05');
  });

  it('tối Chủ nhật giờ UTC đã là thứ Hai ở Việt Nam', () => {
    expect(isVnWeekend(new Date('2026-10-04T18:00:00Z'))).toBe(false);
    expect(isVnWeekend(new Date('2026-10-04T10:00:00Z'))).toBe(true);
  });
});

describe('bài của ngày', () => {
  it('là bài chưa xong có id nhỏ nhất trong track', () => {
    const r = lessonOfTheDay(lessons, 'standup', new Set(['standup-01']), MONDAY);
    expect(r.kind === 'lesson' && r.lesson.id).toBe(2);
  });

  it('không có bài mới vào thứ Bảy và Chủ nhật', () => {
    expect(lessonOfTheDay(lessons, 'standup', new Set(), new Date('2026-10-10T03:00:00Z')).kind).toBe('weekend');
  });

  it('báo hết bài khi đã xong cả track', () => {
    const all = new Set(lessons.filter((l) => l.track === 'standup').map((l) => `standup-0${l.id}`));
    expect(lessonOfTheDay(lessons, 'standup', all, MONDAY).kind).toBe('track_done');
  });

  it('báo track chưa có bài khi chưa có file nội dung', () => {
    expect(lessonOfTheDay(lessons, 'interview', new Set(), MONDAY).kind).toBe('empty');
  });
});

describe('lịch luyện tập', () => {
  it('có 16 tuần, ô cuối là Chủ nhật tuần này và các ngày sau hôm nay để trống', () => {
    const cells = buildHeatmap([], MONDAY);
    expect(cells).toHaveLength(112);
    expect(cells.at(-1)?.date).toBe('2026-10-11');
    expect(cells.filter((c) => c.future)).toHaveLength(6);
    expect(cells[0]?.date).toBe('2026-06-22');
  });

  it('đếm việc theo ngày Việt Nam và tăng độ đậm theo số việc', () => {
    const activity = [
      new Date('2026-10-04T17:30:00Z'), // 00:30 thứ Hai giờ Việt Nam
      new Date('2026-10-05T01:00:00Z'),
      ...Array.from({ length: 7 }, () => new Date('2026-10-01T03:00:00Z')),
    ];
    const cells = buildHeatmap(activity, MONDAY);
    expect(cells.find((c) => c.date === '2026-10-05')).toMatchObject({ count: 2, level: 2 });
    expect(cells.find((c) => c.date === '2026-10-01')).toMatchObject({ count: 7, level: 4 });
    expect(cells.find((c) => c.date === '2026-10-04')?.count).toBe(0);
  });
});

describe('quyền', () => {
  it('Premium thắng dùng thử, hết hạn cả hai thì về miễn phí', () => {
    const past = '2026-10-01T00:00:00Z';
    const future = '2026-10-20T00:00:00Z';
    expect(accessFrom({ premium_until: future, trial_until: future }, MONDAY).kind).toBe('premium');
    expect(accessFrom({ premium_until: past, trial_until: future }, MONDAY).kind).toBe('trial');
    expect(accessFrom({ premium_until: null, trial_until: past }, MONDAY)).toEqual({
      kind: 'free',
      trialEndedAt: new Date(past),
    });
    expect(accessFrom(null, MONDAY).kind).toBe('free');
  });
});

describe('chuyển hướng sau đăng nhập', () => {
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'hom-nay', '/a\nb'])('từ chối %j', (v) => {
    expect(safeNext(v)).toBe('/hom-nay');
  });

  it('nhận đường dẫn nội bộ', () => {
    expect(safeNext('/hoc/hom-qua-da-lam-gi')).toBe('/hoc/hom-qua-da-lam-gi');
  });
});

describe('form tài khoản', () => {
  const form = (entries: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.set(k, v);
    return f;
  };

  it('lưu giờ standup và xóa ngày phỏng vấn khi để trống', () => {
    expect(parseAccountForm(form({ standup_time: '08:30', interview_date: '' }), MONDAY)).toEqual({
      standup_time: '08:30',
      interview_date: null,
    });
  });

  it('từ chối giờ sai và ngày phỏng vấn quá xa', () => {
    expect(parseAccountForm(form({ standup_time: '25:00', interview_date: '' }), MONDAY)).toBeNull();
    expect(parseAccountForm(form({ standup_time: '09:00', interview_date: '2030-01-01' }), MONDAY)).toBeNull();
    expect(parseAccountForm(form({ standup_time: '09:00', interview_date: '2026-11-02' }), MONDAY)).not.toBeNull();
  });
});
