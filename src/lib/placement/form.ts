import { z } from 'zod';
import { TRACKS } from '../content/schema';
import type { PlacementQuestion } from '../content/placement';

/** Form test xếp trình độ: mỗi câu là một nhóm radio, giá trị là vị trí đáp án gốc (0, 1, 2). */
export function parseAnswers(form: FormData, questions: readonly PlacementQuestion[]): Record<string, number> | null {
  const shape = Object.fromEntries(questions.map((q) => [q.id, z.coerce.number().int().min(0).max(2)]));
  const result = z.object(shape).safeParse(Object.fromEntries(form));
  return result.success ? result.data : null;
}

export const trackFormSchema = z.object({ track: z.enum(TRACKS) });
