import { describe, expect, it } from 'vitest';
import { placement, scorePlacement, type PlacementQuestion } from '../../src/lib/content/placement';
import { parseAnswers } from '../../src/lib/placement/form';

const qs = placement.questions;
/** Trả lời đúng `n` câu đầu của mỗi nhóm theo yêu cầu, còn lại sai. */
function answersFor(correctByGroup: Record<PlacementQuestion['group'], number>): Record<string, number> {
  const used = { reading: 0, grammar: 0, polite: 0 };
  return Object.fromEntries(
    qs.map((q) => {
      const right = used[q.group]++ < correctByGroup[q.group];
      return [q.id, right ? 0 : 1];
    }),
  );
}

describe('test xếp trình độ', () => {
  it('content/placement.json có 12 câu, mỗi nhóm 4 câu', () => {
    expect(qs).toHaveLength(12);
  });

  it.each([
    [0, 'basic'],
    [5, 'basic'],
    [6, 'intermediate'],
    [9, 'intermediate'],
    [10, 'good'],
    [12, 'good'],
  ] as const)('đúng %i câu thì xếp %s', (n, level) => {
    const g = { reading: Math.min(4, n), grammar: Math.min(4, Math.max(0, n - 4)), polite: Math.max(0, n - 8) };
    const r = scorePlacement(qs, answersFor(g));
    expect(r.correct).toBe(n);
    expect(r.level).toBe(level);
  });

  it('nhóm ít câu đúng nhất là điểm yếu', () => {
    const r = scorePlacement(qs, answersFor({ reading: 4, grammar: 3, polite: 1 }));
    expect(r.weakArea).toBe('polite');
    expect(r.byGroup).toEqual({ reading: 4, grammar: 3, polite: 1 });
  });

  it('yếu phần đọc hoặc diễn đạt thì gợi ý track Viết, yếu ngữ pháp thì gợi ý Standup', () => {
    expect(scorePlacement(qs, answersFor({ reading: 1, grammar: 4, polite: 4 })).suggestedTrack).toBe('writing');
    expect(scorePlacement(qs, answersFor({ reading: 4, grammar: 4, polite: 2 })).suggestedTrack).toBe('writing');
    expect(scorePlacement(qs, answersFor({ reading: 4, grammar: 0, polite: 4 })).suggestedTrack).toBe('standup');
  });

  it('câu không trả lời tính là sai', () => {
    expect(scorePlacement(qs, {}).correct).toBe(0);
  });

  it('form thiếu câu hoặc giá trị lạ thì không chấm', () => {
    const full = new FormData();
    for (const q of qs) full.set(q.id, '0');
    expect(parseAnswers(full, qs)).not.toBeNull();

    const missing = new FormData();
    missing.set('p01', '0');
    expect(parseAnswers(missing, qs)).toBeNull();

    full.set('p02', '7');
    expect(parseAnswers(full, qs)).toBeNull();
  });
});
