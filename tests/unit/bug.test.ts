import { describe, expect, it } from 'vitest';
import { lessons } from '../../src/lib/content/lessons';
import { allMistakes, bugForDate, bugTargets, shareText } from '../../src/lib/bug/daily';

const words = (s: string, idx: number[]) => idx.map((i) => s.split(/\s+/)[i]);

describe('chỗ sai cần bấm', () => {
  it('là từ thừa hoặc dùng sai', () => {
    const w = 'Yesterday I have fixed the bug.';
    expect(words(w, bugTargets(w, 'Yesterday I fixed the bug.'))).toEqual(['have']);
  });

  it('lỗi thiếu từ thì là từ đứng ngay sau chỗ thiếu', () => {
    const w = "I'm waiting the review.";
    expect(words(w, bugTargets(w, "I'm waiting for the review."))).toEqual(['the']);
  });

  it('từ bị thay thì chỉ tính từ đó, không tính từ đứng sau', () => {
    const w = "I'm blocking by the server issue.";
    expect(words(w, bugTargets(w, "I'm blocked by the server issue."))).toEqual(['blocking']);
  });

  it('mọi câu sai trong nội dung đều có ít nhất một chỗ để bấm', () => {
    for (const { mistake } of allMistakes(lessons)) {
      expect(bugTargets(mistake.wrong, mistake.right).length, mistake.wrong).toBeGreaterThan(0);
    }
  });
});

describe('câu của ngày', () => {
  it('cùng một ngày thì mọi người thấy cùng một câu', () => {
    expect(bugForDate(lessons, '2026-10-05')).toEqual(bugForDate(lessons, '2026-10-05'));
  });

  it('xoay vòng qua mọi câu sai, hai ngày liền nhau khác nhau', () => {
    const n = allMistakes(lessons).length;
    const seen = new Set<string>();
    for (let d = 0; d < n; d++) {
      const date = new Date(Date.UTC(2026, 9, 5 + d)).toISOString().slice(0, 10);
      seen.add(bugForDate(lessons, date)?.wrong ?? '');
    }
    expect(seen.size).toBe(n);
    expect(bugForDate(lessons, '2026-10-05')?.wrong).not.toBe(bugForDate(lessons, '2026-10-06')?.wrong);
  });

  it('không có bài thì không có câu', () => {
    expect(bugForDate([], '2026-10-05')).toBeNull();
  });
});

describe('văn bản chia sẻ', () => {
  const bug = bugForDate(lessons, '2026-10-05');

  it('ghi kết quả và link, không lộ câu sai hay câu đúng', () => {
    const text = shareText('2026-10-05', 2, 'https://epc.example/bug-hom-nay');
    expect(text).toBe(
      'Tìm lỗi mỗi ngày 05/10/2026, English Personal Coach\nTìm ra ở lần thử 2 trên 3.\nThử tìm lỗi trong câu hôm nay: https://epc.example/bug-hom-nay',
    );
    expect(text).not.toContain(bug?.wrong ?? '?');
    expect(text).not.toContain(bug?.right ?? '?');
  });

  it('báo khi không tìm ra', () => {
    expect(shareText('2026-10-05', null, 'u')).toContain('Chưa tìm ra sau 3 lần thử.');
  });
});
