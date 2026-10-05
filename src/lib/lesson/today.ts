import { lessonKey, type Lesson, type Track } from '../content/schema';
import { isVnWeekend } from '../time';

export type TodayLesson =
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'weekend' }
  | { kind: 'track_done' }
  /** Track chưa có file bài nào. */
  | { kind: 'empty' };

/**
 * Bài của ngày (SPEC mục 4): bài chưa xong có id nhỏ nhất trong track đang học.
 * Thứ Bảy và Chủ nhật theo giờ Việt Nam không có bài mới.
 */
export function lessonOfTheDay(
  lessons: readonly Lesson[],
  track: Track,
  completedKeys: ReadonlySet<string>,
  now: Date,
): TodayLesson {
  const inTrack = lessons.filter((l) => l.track === track).sort((a, b) => a.id - b.id);
  if (inTrack.length === 0) return { kind: 'empty' };
  if (isVnWeekend(now)) return { kind: 'weekend' };
  const next = inTrack.find((l) => !completedKeys.has(lessonKey(l)));
  return next ? { kind: 'lesson', lesson: next } : { kind: 'track_done' };
}
