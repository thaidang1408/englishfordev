import { lessonSchema, lessonKey, type Lesson } from './schema';

const TRACK_ORDER = { standup: 0, writing: 1, interview: 2 } as const;

/**
 * Kiểm danh sách file bài học. Ném lỗi nếu một file sai schema, tên file không khớp
 * `<track>-<id>` hoặc slug bị trùng, để build hỏng thay vì ra trang sai.
 */
export function parseLessonFiles(files: Record<string, unknown>): Lesson[] {
  const lessons: Lesson[] = [];
  const errors: string[] = [];

  for (const [path, data] of Object.entries(files)) {
    const result = lessonSchema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.') || '(gốc)'}: ${i.message}`);
      errors.push(`${path}\n  ${issues.join('\n  ')}`);
      continue;
    }
    const expected = `${lessonKey(result.data)}.json`;
    if (!path.endsWith(`/${expected}`)) {
      errors.push(`${path}\n  tên file phải là ${expected}`);
      continue;
    }
    lessons.push(result.data);
  }

  const seen = new Map<string, string>();
  for (const lesson of lessons) {
    const other = seen.get(lesson.slug);
    if (other) errors.push(`slug "${lesson.slug}" trùng giữa ${other} và ${lessonKey(lesson)}`);
    seen.set(lesson.slug, lessonKey(lesson));
  }

  if (errors.length > 0) {
    throw new Error(`Nội dung bài học không hợp lệ:\n${errors.join('\n')}`);
  }

  return lessons.sort((a, b) => TRACK_ORDER[a.track] - TRACK_ORDER[b.track] || a.id - b.id);
}
