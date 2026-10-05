import { z } from 'zod';

/** Tiến độ của khách chưa đăng nhập, lưu trong localStorage. M2 chuyển lên tài khoản. */
export const PROGRESS_KEY = 'epc:progress:v1';

const lessonProgressSchema = z.object({
  // id câu trắc nghiệm → trả lời đúng ở lần chọn đầu tiên hay không
  answers: z.record(z.string(), z.boolean()),
  completed_at: z.iso.datetime().optional(),
});
const progressSchema = z.record(z.string(), lessonProgressSchema);

export type LessonProgress = z.infer<typeof lessonProgressSchema>;
export type Progress = z.infer<typeof progressSchema>;

export function parseProgress(raw: string | null): Progress {
  if (!raw) return {};
  try {
    const result = progressSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : {};
  } catch {
    // JSON hỏng: coi như chưa có tiến độ.
    return {};
  }
}

export function recordAnswer(progress: Progress, key: string, quizId: string, correct: boolean): Progress {
  const current = progress[key] ?? { answers: {} };
  if (quizId in current.answers) return progress;
  return { ...progress, [key]: { ...current, answers: { ...current.answers, [quizId]: correct } } };
}

export function completeLesson(progress: Progress, key: string, now: Date): Progress {
  const current = progress[key] ?? { answers: {} };
  return { ...progress, [key]: { ...current, completed_at: now.toISOString() } };
}

export function resetLesson(progress: Progress, key: string): Progress {
  return Object.fromEntries(Object.entries(progress).filter(([k]) => k !== key));
}

export function countCorrect(lesson: LessonProgress | undefined): number {
  return lesson ? Object.values(lesson.answers).filter(Boolean).length : 0;
}

export function loadProgress(): Progress {
  try {
    return parseProgress(window.localStorage.getItem(PROGRESS_KEY));
  } catch {
    // localStorage bị chặn (chế độ riêng tư): học được, chỉ không nhớ tiến độ.
    return {};
  }
}

export function saveProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Như trên: không lưu được thì bỏ qua, bài học vẫn chạy.
  }
}
