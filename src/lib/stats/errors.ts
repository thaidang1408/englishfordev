import type { Change, Correction, ErrorCategory } from '../ai/schema';
import { addDaysTo } from '../time';

/**
 * Phân tích lỗi (SPEC mục 5b), hàm thuần. Mỗi chỗ sửa trong `changes` là một lỗi.
 * Đầu vào là các lần sửa của một người dùng, thứ tự bất kỳ.
 */
export type ErrorEntry = { created_at: string; original: string; result: Correction };
export type ErrorItem = Change & { original: string; created_at: string };
export type Trend = 'up' | 'down' | 'same';
export type CategoryStat = { category: ErrorCategory; count: number; example: ErrorItem };
export type WeeklyStat = { category: ErrorCategory; thisWeek: number; lastWeek: number; trend: Trend };

export const ANALYSIS_DAYS = 28;
export const TOP_CATEGORIES = 3;

/** Mọi lỗi, mới nhất trước. */
export function flattenErrors(entries: readonly ErrorEntry[]): ErrorItem[] {
  return [...entries]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .flatMap((e) => e.result.changes.map((c) => ({ ...c, original: e.original, created_at: e.created_at })));
}

/** Ba nhóm lỗi hay mắc nhất trong 28 ngày, mỗi nhóm kèm ví dụ gần nhất của chính người dùng. */
export function topCategories(entries: readonly ErrorEntry[], now: Date, size = TOP_CATEGORIES): CategoryStat[] {
  const since = addDaysTo(now, -ANALYSIS_DAYS).getTime();
  const stats = new Map<ErrorCategory, CategoryStat>();
  for (const item of flattenErrors(entries)) {
    const t = Date.parse(item.created_at);
    if (t < since || t > now.getTime()) continue;
    const s = stats.get(item.category);
    // flattenErrors đã xếp mới nhất trước, nên ví dụ đầu tiên gặp là ví dụ gần nhất.
    if (s) s.count += 1;
    else stats.set(item.category, { category: item.category, count: 1, example: item });
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count || Date.parse(b.example.created_at) - Date.parse(a.example.created_at))
    .slice(0, size);
}

/** So 7 ngày gần nhất với 7 ngày trước đó cho từng nhóm có lỗi trong 14 ngày. */
export function weeklyTrend(entries: readonly ErrorEntry[], now: Date): WeeklyStat[] {
  const weekAgo = addDaysTo(now, -7).getTime();
  const twoWeeksAgo = addDaysTo(now, -14).getTime();
  const rows = new Map<ErrorCategory, { thisWeek: number; lastWeek: number }>();
  for (const item of flattenErrors(entries)) {
    const t = Date.parse(item.created_at);
    if (t > now.getTime() || t <= twoWeeksAgo) continue;
    const row = rows.get(item.category) ?? { thisWeek: 0, lastWeek: 0 };
    if (t > weekAgo) row.thisWeek += 1;
    else row.lastWeek += 1;
    rows.set(item.category, row);
  }
  return [...rows]
    .map(([category, r]) => ({
      category,
      ...r,
      trend: (r.thisWeek > r.lastWeek ? 'up' : r.thisWeek < r.lastWeek ? 'down' : 'same') as Trend,
    }))
    .sort((a, b) => b.thisWeek + b.lastWeek - (a.thisWeek + a.lastWeek));
}

export function totalErrors(entries: readonly ErrorEntry[]): number {
  return entries.reduce((n, e) => n + e.result.changes.length, 0);
}
