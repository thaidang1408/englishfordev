import { describe, expect, it } from 'vitest';
import { fitsRoles, parseRoles } from '../../src/lib/content/roles';
import type { Lesson } from '../../src/lib/content/schema';
import { lessonOfTheDay } from '../../src/lib/lesson/today';

const form = (...roles: string[]) => {
  const f = new FormData();
  for (const r of roles) f.append('roles', r);
  return f;
};

describe('chọn ngành', () => {
  it('đọc nhiều ngành, giữ thứ tự cố định; không chọn hoặc giá trị lạ thì null', () => {
    expect(parseRoles(form('pm', 'dev'))).toEqual(['dev', 'pm']);
    expect(parseRoles(form())).toBeNull();
    expect(parseRoles(form('dev', 'admin'))).toBeNull();
  });

  it('bài chung hợp mọi ngành; bài chuyên ngành chỉ hợp ngành có trong nhãn; chưa chọn ngành thì hợp hết', () => {
    expect(fitsRoles(undefined, ['qa'])).toBe(true);
    expect(fitsRoles(['dev'], ['qa', 'dev'])).toBe(true);
    expect(fitsRoles(['dev'], ['ba'])).toBe(false);
    expect(fitsRoles(['dev'], [])).toBe(true);
  });

  it('bài của ngày: bài hợp ngành đi trước, bài không hợp để cuối nhưng vẫn được học', () => {
    const MONDAY = new Date('2026-10-05T02:00:00Z');
    const mk = (id: number, roles?: Lesson['roles']) => ({ id, track: 'writing', slug: `w${id}`, roles }) as unknown as Lesson;
    const ls = [mk(1, ['dev']), mk(2, ['dev']), mk(3), mk(4, ['ba', 'qa'])];
    const pick = (done: string[], roles: Parameters<typeof lessonOfTheDay>[4]) => {
      const t = lessonOfTheDay(ls, 'writing', new Set(done), MONDAY, roles);
      return t.kind === 'lesson' ? t.lesson.id : t.kind;
    };
    expect(pick([], ['ba'])).toBe(3);
    expect(pick(['writing-03', 'writing-04'], ['ba'])).toBe(1);
    expect(pick([], [])).toBe(1);
    expect(pick([], ['dev'])).toBe(1);
  });
});
