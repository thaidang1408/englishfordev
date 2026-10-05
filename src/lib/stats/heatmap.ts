import { addDays, vnDateKey, vnWeekday } from '../time';

export type HeatCell = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4; future: boolean };

/**
 * Lịch luyện tập `weeks` tuần, mỗi cột một tuần từ thứ Hai tới Chủ nhật, cột cuối là tuần này.
 * `activity` là thời điểm các việc đã làm (xong bài, câu được sửa, lần ôn).
 */
export function buildHeatmap(activity: readonly Date[], now: Date, weeks = 16): HeatCell[] {
  const counts = new Map<string, number>();
  for (const d of activity) {
    const key = vnDateKey(d);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = vnDateKey(now);
  const mondayOffset = (vnWeekday(now) + 6) % 7; // thứ Hai = 0
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7);

  const cells: HeatCell[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(start, i);
    const count = counts.get(date) ?? 0;
    cells.push({ date, count, level: levelFor(count), future: date > today });
  }
  return cells;
}

function levelFor(count: number): HeatCell['level'] {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}
