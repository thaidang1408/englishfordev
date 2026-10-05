import { addDaysTo } from '../time';

/** Hộp Leitner (SPEC mục 5): mức 1, 2, 3, 4 ôn lại sau 1, 3, 7, 14 ngày. Mức 5 là đã thuộc. */
export const BOX_DAYS = [1, 3, 7, 14] as const;
export const LEARNED_BOX = 5;

/** Hạn ôn đầu tiên của một mục mới (mức 1). */
export function firstDue(now: Date): Date {
  return addDaysTo(now, BOX_DAYS[0]);
}
