import { z } from 'zod';

export const TRACKS = ['standup', 'writing', 'interview'] as const;
export const trackSchema = z.enum(TRACKS);
export type Track = z.infer<typeof trackSchema>;

const text = z.string().trim().min(1);

const quizItemSchema = z.strictObject({
  id: z.string().regex(/^[swi]\d{2}q[1-5]$/),
  prompt_vi: text,
  options: z.array(text).length(3),
  // Trong file, đáp án đúng luôn ở vị trí 0. Giao diện tự đảo.
  answer: z.literal(0),
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
    examples: z.array(z.strictObject({ en: text, vi: text })).length(3),
    mistakes: z.array(z.strictObject({ wrong: text, right: text, why_vi: text })).min(2).max(3),
    word_bank: z.array(text),
    quiz: z.array(quizItemSchema).length(5),
    write_prompt_vi: text,
    question_en: text.optional(),
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
