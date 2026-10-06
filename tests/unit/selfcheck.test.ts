import { describe, expect, it } from 'vitest';
import { fixedCount, markFragments, sameSentence } from '../../src/lib/correct/selfcheck';

describe('tự sửa trước', () => {
  it('coi là khớp khi chỉ khác chữ hoa, khoảng trắng, dấu nháy và dấu câu cuối', () => {
    expect(sameSentence('Yesterday I fixed the login bug.', '  yesterday i fixed  the login bug ')).toBe(true);
    expect(sameSentence("I couldn't reproduce it.", 'I couldn’t reproduce it')).toBe(true);
  });

  it('khác một chữ là chưa khớp', () => {
    expect(sameSentence('Yesterday I fixed the login bug.', 'Yesterday I fixed login bug.')).toBe(false);
    expect(sameSentence('I fixed the bug.', 'I fixed the bug, too.')).toBe(false);
  });

  it('tô lần xuất hiện đầu tiên của từng đoạn sai, giữ nguyên phần còn lại', () => {
    const pieces = markFragments('I have fixed bug login yesterday.', ['have fixed', 'bug login']);
    expect(pieces).toEqual([
      { text: 'I ', mark: false },
      { text: 'have fixed', mark: true },
      { text: ' ', mark: false },
      { text: 'bug login', mark: true },
      { text: ' yesterday.', mark: false },
    ]);
    expect(pieces.map((p) => p.text).join('')).toBe('I have fixed bug login yesterday.');
  });

  it('đoạn rỗng, không tìm thấy hoặc chồng nhau thì bỏ qua; đoạn lặp lại tô chỗ kế tiếp', () => {
    expect(markFragments('a bug', ['', 'xyz'])).toEqual([{ text: 'a bug', mark: false }]);
    expect(markFragments('the the end', ['the', 'the']).filter((p) => p.mark)).toHaveLength(2);
    expect(markFragments('fixed bug', ['fixed bug', 'bug']).filter((p) => p.mark).map((p) => p.text)).toEqual(['fixed bug']);
  });
});

describe('fixedCount', () => {
  const changes = [
    { from: 'He go', to: 'He goes' },
    { from: 'yesterday meeting', to: "yesterday's meeting" },
  ];
  it('đếm từng chỗ đã sửa, bỏ qua chỗ AI đổi thêm', () => {
    expect(fixedCount("He goes to yesterday's meeting", changes)).toBe(2);
    expect(fixedCount('He goes to yesterday meeting', changes)).toBe(1);
    expect(fixedCount('He go to yesterday meeting', changes)).toBe(0);
  });
  it('chỗ cần xóa tính đúng khi đoạn sai không còn', () => {
    expect(fixedCount('Please check it', [{ from: 'again', to: '' }])).toBe(1);
    expect(fixedCount('Please check it again', [{ from: 'again', to: '' }])).toBe(0);
  });
});
