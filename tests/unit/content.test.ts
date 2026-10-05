import { describe, expect, it } from 'vitest';
import { parseLessonFiles } from '../../src/lib/content/load';
import { lessonKey } from '../../src/lib/content/schema';
import { lessons } from '../../src/lib/content/lessons';
import standup01 from '../../content/lessons/standup-01.json';

const PATH = '/content/lessons/standup-01.json';
const clone = (): Record<string, unknown> => structuredClone(standup01) as Record<string, unknown>;

describe('nội dung bài học', () => {
  it('mọi file trong content/lessons qua được schema', () => {
    expect(lessons.length).toBeGreaterThanOrEqual(3);
    for (const lesson of lessons) {
      expect(lesson.quiz.every((q) => q.answer === 0)).toBe(true);
    }
  });

  it('chỉ standup 1 đến 3 là bài miễn phí', () => {
    expect(lessons.filter((l) => l.free).map(lessonKey)).toEqual(['standup-01', 'standup-02', 'standup-03']);
  });

  it('báo lỗi khi bài thiếu một ví dụ', () => {
    const bad = clone();
    bad.examples = (bad.examples as unknown[]).slice(0, 2);
    expect(() => parseLessonFiles({ [PATH]: bad })).toThrow(/examples/);
  });

  it('báo lỗi khi đáp án đúng không ở vị trí 0', () => {
    const bad = clone();
    const quiz = bad.quiz as { answer: number }[];
    quiz[0]!.answer = 1;
    expect(() => parseLessonFiles({ [PATH]: bad })).toThrow(/quiz\.0\.answer/);
  });

  it('báo lỗi khi có trường lạ', () => {
    const bad = clone();
    bad.extra = 'x';
    expect(() => parseLessonFiles({ [PATH]: bad })).toThrow();
  });

  it('báo lỗi khi bài trả phí lại đánh dấu free', () => {
    const bad = clone();
    bad.id = 4;
    bad.quiz = (bad.quiz as { id: string }[]).map((q, i) => ({ ...q, id: `s04q${i + 1}` }));
    expect(() => parseLessonFiles({ '/content/lessons/standup-04.json': bad })).toThrow(/free/);
  });

  it('báo lỗi khi tên file không khớp track và id', () => {
    expect(() => parseLessonFiles({ '/content/lessons/standup-09.json': clone() })).toThrow(/standup-01\.json/);
  });

  it('báo lỗi khi hai bài trùng slug', () => {
    const second = clone();
    second.id = 2;
    second.quiz = (second.quiz as { id: string }[]).map((q, i) => ({ ...q, id: `s02q${i + 1}` }));
    expect(() =>
      parseLessonFiles({ [PATH]: clone(), '/content/lessons/standup-02.json': second }),
    ).toThrow(/trùng/);
  });
});
