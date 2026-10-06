import { z } from 'zod';

export const TRACKS = ['standup', 'writing', 'interview'] as const;

/** Ngành người dùng chọn (SPEC mục 16). Để ở đây để file này không import file khác trong dự án. */
export const ROLES = ['dev', 'qa', 'ba', 'pm'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;
export const trackSchema = z.enum(TRACKS);
export type Track = z.infer<typeof trackSchema>;

const text = z.string().trim().min(1);

const quizItemSchema = z.strictObject({
  id: z.string().regex(/^[swi]\d{2}q([1-9]|10)$/),
  prompt_vi: text,
  options: z.array(text).length(3),
  // Trong file, đáp án đúng luôn ở vị trí 0. Giao diện tự đảo.
  answer: z.literal(0),
  /** Nghĩa tiếng Việt của đáp án đúng, hiện cùng lời giải thích. */
  answer_vi: text,
  why_vi: text,
});

export const lessonSchema = z
  .strictObject({
    id: z.number().int().min(1).max(99),
    track: trackSchema,
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: text,
    free: z.boolean(),
    goal_vi: text,
    pattern: z.strictObject({ formula: text, note_vi: text }),
    // Trình học hiện 3 ví dụ và 5 câu trắc nghiệm lấy ngẫu nhiên (SPEC mục 14).
    examples: z.array(z.strictObject({ en: text, vi: text })).length(5),
    mistakes: z.array(z.strictObject({ wrong: text, right: text, right_vi: text, why_vi: text })).length(3),
    word_bank: z.array(text),
    // Tin nhắn hoàn chỉnh như ngoài đời và các ý bài viết nên có (SPEC mục 15).
    model: z.strictObject({ title_vi: text, en: text, vi: text }),
    checklist_vi: z.array(text).min(3).max(5),
    quiz: z.array(quizItemSchema).length(10),
    write_prompt_vi: text,
    question_en: text.optional(),
    // Bài chuyên ngành (SPEC mục 16). Không có là bài chung.
    roles: z.array(roleSchema).min(1).max(3).optional(),
  })
  .superRefine((lesson, ctx) => {
    const isFreeLesson = lesson.track === 'standup' && lesson.id <= 3;
    if (lesson.free !== isFreeLesson) {
      ctx.addIssue({ code: 'custom', path: ['free'], message: 'Chỉ standup 1 đến 3 là free' });
    }
    if ((lesson.track === 'interview') !== (lesson.question_en !== undefined)) {
      ctx.addIssue({ code: 'custom', path: ['question_en'], message: 'question_en có khi và chỉ khi track là interview' });
    }
    const prefix = `${lesson.track[0]}${String(lesson.id).padStart(2, '0')}q`;
    lesson.quiz.forEach((q, i) => {
      if (q.id !== `${prefix}${i + 1}`) {
        ctx.addIssue({ code: 'custom', path: ['quiz', i, 'id'], message: `id phải là ${prefix}${i + 1}` });
      }
    });
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type QuizItem = Lesson['quiz'][number];

export function lessonKey(lesson: Pick<Lesson, 'track' | 'id'>): string {
  return `${lesson.track}-${String(lesson.id).padStart(2, '0')}`;
}
