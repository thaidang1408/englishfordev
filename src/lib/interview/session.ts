import type { ErrorCategory } from '../ai/schema';
import { lessonKey, type Lesson } from '../content/schema';

export const SESSION_QUESTIONS = 5;

export type InterviewQuestion = { lessonKey: string; title: string; question: string };

/**
 * Phỏng vấn thử (SPEC mục 7b): 5 câu hỏi lấy ngẫu nhiên từ question_en của track Phỏng vấn,
 * ưu tiên bài đã học. `random` được tiêm vào để test không phụ thuộc may rủi.
 */
export function pickInterviewQuestions(
  lessons: readonly Lesson[],
  done: ReadonlySet<string>,
  random: () => number = Math.random,
  size = SESSION_QUESTIONS,
): InterviewQuestion[] {
  const pool = lessons.flatMap((l) =>
    l.track === 'interview' && l.question_en ? [{ lessonKey: lessonKey(l), title: l.title, question: l.question_en }] : [],
  );
  const shuffle = <T>(xs: T[]): T[] => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j] as T, a[i] as T];
    }
    return a;
  };
  const learned = shuffle(pool.filter((q) => done.has(q.lessonKey)));
  const rest = shuffle(pool.filter((q) => !done.has(q.lessonKey)));
  return [...learned, ...rest].slice(0, size);
}

/** Tổng kết cuối phiên: số chỗ sửa theo nhóm lỗi, nhiều nhất trước. Không chấm điểm. */
export function countByCategory(changes: readonly { category: ErrorCategory }[]): { category: ErrorCategory; count: number }[] {
  const counts = new Map<ErrorCategory, number>();
  for (const c of changes) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return [...counts].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}
