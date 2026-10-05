import { z } from 'zod';
import data from '../../../content/placement.json';
import type { Track } from './schema';

const text = z.string().trim().min(1);

export const PLACEMENT_GROUPS = ['reading', 'grammar', 'polite'] as const;
export type PlacementGroup = (typeof PLACEMENT_GROUPS)[number];

const questionSchema = z.strictObject({
  id: z.string().regex(/^p\d{2}$/),
  group: z.enum(PLACEMENT_GROUPS),
  context_en: text.optional(),
  prompt_vi: text,
  options: z.array(text).length(3),
  answer: z.literal(0),
  why_vi: text,
});

export const placementSchema = z
  .strictObject({ questions: z.array(questionSchema).length(12) })
  .superRefine((p, ctx) => {
    for (const group of PLACEMENT_GROUPS) {
      if (p.questions.filter((q) => q.group === group).length !== 4) {
        ctx.addIssue({ code: 'custom', path: ['questions'], message: `nhóm ${group} phải có đúng 4 câu` });
      }
    }
    if (new Set(p.questions.map((q) => q.id)).size !== p.questions.length) {
      ctx.addIssue({ code: 'custom', path: ['questions'], message: 'id câu bị trùng' });
    }
  });

export type PlacementQuestion = z.infer<typeof questionSchema>;

// Sai schema thì build hỏng.
export const placement = placementSchema.parse(data);

export const LEVELS = ['basic', 'intermediate', 'good'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<Level, string> = { basic: 'Cơ bản', intermediate: 'Trung bình', good: 'Khá' };
export const GROUP_NAMES: Record<PlacementGroup, string> = {
  reading: 'Đọc hiểu comment và tin nhắn công việc',
  grammar: 'Chọn câu đúng',
  polite: 'Nói lịch sự và rõ ý',
};

export type PlacementResult = {
  correct: number;
  byGroup: Record<PlacementGroup, number>;
  level: Level;
  weakArea: PlacementGroup;
  suggestedTrack: Track;
};

/**
 * Chấm test theo SPEC mục 6. `answers` là id câu → vị trí đáp án gốc người dùng chọn.
 * Câu không trả lời tính là sai. Nhóm yếu là nhóm ít câu đúng nhất; hòa thì theo thứ tự PLACEMENT_GROUPS.
 */
export function scorePlacement(questions: readonly PlacementQuestion[], answers: Record<string, number>): PlacementResult {
  const byGroup: Record<PlacementGroup, number> = { reading: 0, grammar: 0, polite: 0 };
  for (const q of questions) {
    if (answers[q.id] === q.answer) byGroup[q.group]++;
  }
  const correct = byGroup.reading + byGroup.grammar + byGroup.polite;
  const level: Level = correct <= 5 ? 'basic' : correct <= 9 ? 'intermediate' : 'good';
  const weakArea = PLACEMENT_GROUPS.reduce((weak, g) => (byGroup[g] < byGroup[weak] ? g : weak), PLACEMENT_GROUPS[0]);
  // Đọc và diễn đạt trong tin nhắn là kỹ năng viết cho team; câu sai ngữ pháp cơ bản thì bắt đầu từ standup.
  const suggestedTrack: Track = weakArea === 'grammar' ? 'standup' : 'writing';
  return { correct, byGroup, level, weakArea, suggestedTrack };
}
