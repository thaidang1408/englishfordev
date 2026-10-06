import { fitsRoles, type Role } from '../content/roles';
import { lessonKey, type Lesson, type Track } from '../content/schema';
import { isVnWeekend } from '../time';

export type TodayLesson =
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'weekend' }
  | { kind: 'track_done' }
  /** Track chưa có file bài nào. */
  | { kind: 'empty' };

/**
 * Bài của ngày (SPEC mục 4 và 16): bài chưa xong có id nhỏ nhất trong track đang học, bài hợp ngành đi trước.
 * Thứ Bảy và Chủ nhật theo giờ Việt Nam không có bài mới.
 */
export function lessonOfTheDay(
  lessons: readonly Lesson[],
  track: Track,
  completedKeys: ReadonlySet<string>,
  now: Date,
  roles: readonly Role[] = [],
): TodayLesson {
  const inTrack = lessons.filter((l) => l.track === track).sort((a, b) => a.id - b.id);
  if (inTrack.length === 0) return { kind: 'empty' };
  if (isVnWeekend(now)) return { kind: 'weekend' };
  const open = inTrack.filter((l) => !completedKeys.has(lessonKey(l)));
  const next = open.find((l) => fitsRoles(l.roles, roles)) ?? open[0];
  return next ? { kind: 'lesson', lesson: next } : { kind: 'track_done' };
}
