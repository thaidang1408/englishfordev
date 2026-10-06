import { describe, expect, it } from 'vitest';
import { lessons } from '../../src/lib/content/lessons';
import { allMistakes, bugsForDate, bugTargets, practiceBugs } from '../../src/lib/bug/daily';
import { linePoints, prNumber, resultGrid, shareText, streakFrom, verdict } from '../../src/lib/bug/share';

const words = (s: string, idx: number[]) => idx.map((i) => s.split(/\s+/)[i]);
const day = (d: number) => new Date(Date.UTC(2026, 9, 5 + d)).toISOString().slice(0, 10);

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

describe('PR của ngày', () => {
  it('mỗi ngày 3 câu, cùng một ngày thì mọi người thấy cùng 3 câu', () => {
    expect(bugsForDate(lessons, '2026-10-05')).toHaveLength(3);
    expect(bugsForDate(lessons, '2026-10-05')).toEqual(bugsForDate(lessons, '2026-10-05'));
  });

  it('3 câu trong ngày thuộc 3 bài khác nhau', () => {
    for (let d = 0; d < 60; d++) {
      const keys = bugsForDate(lessons, day(d)).map((b) => b.lesson.key);
      expect(new Set(keys).size, day(d)).toBe(3);
    }
  });

  it('xoay vòng qua mọi câu sai, không lặp lại trước khi hết vòng', () => {
    const n = allMistakes(lessons).length;
    const seen = new Set<string>();
    for (let d = 0; d < Math.floor(n / 3); d++) for (const b of bugsForDate(lessons, day(d))) seen.add(b.wrong);
    expect(seen.size).toBe(Math.floor(n / 3) * 3);
  });

  it('câu chơi thêm không trùng câu hôm nay', () => {
    const today = new Set(bugsForDate(lessons, '2026-10-05').map((b) => b.wrong));
    const more = practiceBugs(lessons, '2026-10-05');
    expect(more.length).toBe(30);
    expect(more.some((b) => today.has(b.wrong))).toBe(false);
  });

  it('không có bài thì không có câu', () => {
    expect(bugsForDate([], '2026-10-05')).toEqual([]);
    expect(practiceBugs([], '2026-10-05')).toEqual([]);
  });
});

describe('điểm và kết luận', () => {
  it('tìm ra càng sớm càng nhiều điểm', () => {
    expect([1, 2, 3].map((tries) => linePoints({ tries, found: true }))).toEqual([3, 2, 1]);
    expect(linePoints({ tries: 3, found: false })).toBe(0);
  });

  it('kết luận theo điểm trên 9', () => {
    expect(verdict(9, 9).label).toBe('Approve');
    expect(verdict(6, 9).label).toBe('Approve, kèm góp ý');
    expect(verdict(3, 9).label).toBe('Request changes');
    expect(verdict(2, 9).label).toBe('Cần review lại');
  });

  it('ô kết quả: ô rỗng cho lần sai, ô đặc cho lần tìm ra', () => {
    expect(resultGrid([{ tries: 1, found: true }, { tries: 3, found: true }, { tries: 3, found: false }])).toBe('■ □□■ □□□');
  });

  it('chuỗi ngày tính lùi từ hôm nay, hôm nay chưa chơi thì từ hôm qua', () => {
    expect(streakFrom(['2026-10-05', '2026-10-06', '2026-10-07'], '2026-10-07')).toBe(3);
    expect(streakFrom(['2026-10-05', '2026-10-06'], '2026-10-07')).toBe(2);
    expect(streakFrom(['2026-10-04', '2026-10-06'], '2026-10-07')).toBe(1);
    expect(streakFrom([], '2026-10-07')).toBe(0);
  });

  it('số PR theo ngày và tháng', () => {
    expect(prNumber('2026-10-07')).toBe('#0710');
  });
});

describe('văn bản chia sẻ', () => {
  const lines = [
    { tries: 1, found: true },
    { tries: 2, found: true },
    { tries: 3, found: false },
  ];

  it('ghi ô, kết luận, điểm, thời gian, chuỗi và link, không lộ câu', () => {
    const text = shareText('2026-10-05', lines, 72, 4, 'https://epc.example/bug-hom-nay?src=bug-share');
    expect(text).toBe(
      [
        'Review PR #0510, English Personal Coach',
        '■ □■ □□□',
        'Request changes · 5/9 điểm · 1:12',
        'Chuỗi 4 ngày',
        'Bạn review thử PR hôm nay: https://epc.example/bug-hom-nay?src=bug-share',
      ].join('\n'),
    );
    for (const b of bugsForDate(lessons, '2026-10-05')) {
      expect(text).not.toContain(b.wrong);
      expect(text).not.toContain(b.right);
    }
  });

  it('chuỗi 1 ngày thì không ghi dòng chuỗi', () => {
    expect(shareText('2026-10-05', lines, null, 1, 'u')).not.toContain('Chuỗi');
  });
});
