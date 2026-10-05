import { z } from 'zod';
import { hasFullAccess, type Access } from '../auth/access';
import { lessonKey, type Lesson } from '../content/schema';
import type { LessonProgressRow, ReviewItemRow } from '../db/types';
import { firstDue } from '../review/leitner';

/** Body của POST /api/progress: đúng dạng tiến độ trong localStorage, có giới hạn kích thước. */
export const syncBodySchema = z.object({
  progress: z
    .record(
      z.string().regex(/^(standup|writing|interview)-\d{2}$/),
      z.object({
        answers: z.record(z.string().regex(/^[swi]\d{2}q[1-5]$/), z.boolean()),
        completed_at: z.iso.datetime().optional(),
      }),
    )
    .refine((p) => Object.keys(p).length <= 30, 'Quá nhiều bài'),
});
export type SyncBody = z.infer<typeof syncBodySchema>;

export type SyncPlan =
  | { ok: true; lessonRows: Omit<LessonProgressRow, never>[]; reviewRows: Pick<ReviewItemRow, 'user_id' | 'kind' | 'lesson_key' | 'ref' | 'due_at' | 'box'>[] }
  | { ok: false; reason: 'unknown_lesson' | 'unknown_question' | 'locked' };

/**
 * Từ tiến độ gửi lên, tính các dòng cần ghi:
 * - bài đã xong → lesson_progress (điểm = số câu đúng lần đầu);
 * - câu trả lời sai → mục ôn quiz, hạn ôn đầu tiên sau 1 ngày (SPEC mục 4, 5).
 * Bài trả phí chỉ được ghi khi tài khoản có Premium hoặc đang dùng thử.
 */
export function planSync(
  body: SyncBody,
  lessons: readonly Lesson[],
  access: Access,
  userId: string,
  now: Date,
): SyncPlan {
  const byKey = new Map(lessons.map((l) => [lessonKey(l), l]));
  const lessonRows: LessonProgressRow[] = [];
  const reviewRows: Extract<SyncPlan, { ok: true }>['reviewRows'] = [];

  for (const [key, lp] of Object.entries(body.progress)) {
    const lesson = byKey.get(key);
    if (!lesson) return { ok: false, reason: 'unknown_lesson' };
    if (!lesson.free && !hasFullAccess(access)) return { ok: false, reason: 'locked' };

    const quizIds = new Set(lesson.quiz.map((q) => q.id));
    for (const [qid, correct] of Object.entries(lp.answers)) {
      if (!quizIds.has(qid)) return { ok: false, reason: 'unknown_question' };
      if (!correct) {
        reviewRows.push({ user_id: userId, kind: 'quiz', lesson_key: key, ref: qid, box: 1, due_at: firstDue(now).toISOString() });
      }
    }

    if (lp.completed_at) {
      const done = new Date(lp.completed_at);
      lessonRows.push({
        user_id: userId,
        lesson_key: key,
        score: Object.values(lp.answers).filter(Boolean).length,
        completed_at: (done > now ? now : done).toISOString(),
      });
    }
  }
  return { ok: true, lessonRows, reviewRows };
}
