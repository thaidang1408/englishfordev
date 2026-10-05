import { describe, expect, it } from 'vitest';
import { diffWords } from '../../src/lib/lesson/diff';
import { shuffledIndexes } from '../../src/lib/lesson/shuffle';
import {
  completeLesson,
  countCorrect,
  parseProgress,
  recordAnswer,
  resetLesson,
} from '../../src/lib/lesson/progress';

describe('diffWords', () => {
  it('chỉ tô chỗ thay đổi, giữ nguyên phần giống nhau', () => {
    const { before, after } = diffWords('Yesterday I have fixed the bug.', 'Yesterday I fixed the bug.');
    expect(before.filter((s) => s.changed).map((s) => s.text.trim())).toEqual(['have']);
    expect(after.some((s) => s.changed)).toBe(false);
    expect(before.map((s) => s.text).join('')).toBe('Yesterday I have fixed the bug.');
    expect(after.map((s) => s.text).join('')).toBe('Yesterday I fixed the bug.');
  });

  it('gom các từ đổi liền nhau thành một đoạn', () => {
    const { before, after } = diffWords('I fixed bug login.', 'I fixed the login bug.');
    expect(before.filter((s) => s.changed).length).toBe(1);
    expect(after.filter((s) => s.changed).length).toBeGreaterThanOrEqual(1);
    expect(after.map((s) => s.text).join('')).toBe('I fixed the login bug.');
  });
});

describe('shuffledIndexes', () => {
  it('trả về đủ mọi vị trí, mỗi vị trí một lần', () => {
    const order = shuffledIndexes(3, () => 0.5);
    expect([...order].sort()).toEqual([0, 1, 2]);
  });

  it('đổi được vị trí của đáp án đúng', () => {
    // random luôn 0: mỗi bước đổi chỗ với đầu mảng, đáp án 0 bị đẩy ra cuối
    expect(shuffledIndexes(3, () => 0)).toEqual([1, 2, 0]);
  });
});

describe('tiến độ trong localStorage', () => {
  it('bỏ qua dữ liệu hỏng thay vì làm hỏng trang', () => {
    expect(parseProgress('{không phải json')).toEqual({});
    expect(parseProgress(JSON.stringify({ 'standup-01': { answers: 'x' } }))).toEqual({});
    expect(parseProgress(null)).toEqual({});
  });

  it('chỉ ghi lần trả lời đầu tiên của mỗi câu', () => {
    let p = recordAnswer({}, 'standup-01', 's01q1', false);
    p = recordAnswer(p, 'standup-01', 's01q1', true);
    expect(p['standup-01']?.answers).toEqual({ s01q1: false });
  });

  it('đếm số câu đúng và ghi thời điểm học xong', () => {
    let p = recordAnswer({}, 'standup-01', 's01q1', true);
    p = recordAnswer(p, 'standup-01', 's01q2', false);
    p = completeLesson(p, 'standup-01', new Date('2026-10-05T02:00:00Z'));
    expect(countCorrect(p['standup-01'])).toBe(1);
    expect(p['standup-01']?.completed_at).toBe('2026-10-05T02:00:00.000Z');
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
  });

  it('học lại thì xóa tiến độ của đúng bài đó', () => {
    let p = recordAnswer({}, 'standup-01', 's01q1', true);
    p = recordAnswer(p, 'standup-02', 's02q1', true);
    expect(Object.keys(resetLesson(p, 'standup-01'))).toEqual(['standup-02']);
  });
});
