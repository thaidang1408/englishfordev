import { addDaysTo } from '../time';

/**
 * Hộp Leitner (SPEC mục 5): mức 1, 2, 3, 4 ôn lại sau 1, 3, 7, 14 ngày.
 * Đúng thì lên một mức, sai thì về mức 1. Qua mức 14 ngày (mức 5) là đã thuộc, không ôn nữa.
 */
export const BOX_DAYS = [1, 3, 7, 14] as const;
export const LEARNED_BOX = 5;
export const SESSION_SIZE = 10;

/** Hạn ôn đầu tiên của một mục mới (mức 1). */
export function firstDue(now: Date): Date {
  return addDaysTo(now, BOX_DAYS[0]);
}

export type ReviewState = { box: number; due_at: string };

export function nextState(box: number, correct: boolean, now: Date): ReviewState {
  const nextBox = correct ? Math.min(box + 1, LEARNED_BOX) : 1;
  // Mục đã thuộc giữ hạn ôn hiện tại cho dễ đọc; phiên ôn luôn bỏ qua mức 5.
  const days = nextBox >= LEARNED_BOX ? 0 : BOX_DAYS[nextBox - 1] ?? BOX_DAYS[0];
  return { box: nextBox, due_at: addDaysTo(now, days).toISOString() };
}

export function isDue(item: { box: number; due_at: string }, now: Date): boolean {
  return item.box < LEARNED_BOX && new Date(item.due_at) <= now;
}

/** Phiên ôn: tối đa 10 mục đến hạn, quá hạn lâu nhất lên trước. */
export function pickSession<T extends { box: number; due_at: string }>(items: readonly T[], now: Date, size = SESSION_SIZE): T[] {
  return items
    .filter((i) => isDue(i, now))
    .sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at))
    .slice(0, size);
}
