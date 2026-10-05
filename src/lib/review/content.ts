import type { Lesson, QuizItem } from '../content/schema';
import { lessonKey } from '../content/schema';

/** Tìm câu trắc nghiệm gốc của một mục ôn quiz (lesson_key + id câu). */
export function findQuizItem(
  lessons: readonly Lesson[],
  key: string | null,
  ref: string,
): { lesson: Lesson; item: QuizItem } | null {
  const lesson = lessons.find((l) => lessonKey(l) === key);
  const item = lesson?.quiz.find((q) => q.id === ref);
  return lesson && item ? { lesson, item } : null;
}
