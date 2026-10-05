import { z } from 'zod';

/** Nhóm lỗi (SPEC mục 7). Tên hiển thị ở CATEGORY_NAMES. */
export const ERROR_CATEGORIES = [
  'article',
  'tense',
  'preposition',
  'word_order',
  'word_choice',
  'verb_form',
  'plural',
  'other',
] as const;
export const errorCategorySchema = z.enum(ERROR_CATEGORIES);
export type ErrorCategory = z.infer<typeof errorCategorySchema>;

export const CATEGORY_NAMES: Record<ErrorCategory, string> = {
  article: 'mạo từ',
  tense: 'thì của động từ',
  preposition: 'giới từ',
  word_order: 'trật tự từ',
  word_choice: 'chọn từ',
  verb_form: 'dạng động từ',
  plural: 'số ít số nhiều',
  other: 'khác',
};

export const MAX_CHANGES = 4;

export const changeSchema = z.object({
  from: z.string().max(200),
  to: z.string().max(200),
  why_vi: z.string().min(1).max(300),
  category: errorCategorySchema,
});
export type Change = z.infer<typeof changeSchema>;

/**
 * Kết quả AI sửa câu. z.object bỏ trường thừa; mọi chuỗi có giới hạn độ dài (skill security).
 * Dùng cho cả output_config gửi AI lẫn khi đọc lại `corrections.result` từ database.
 */
export const correctionSchema = z.object({
  is_already_correct: z.boolean(),
  corrected: z.string().max(1500),
  changes: z.array(changeSchema).max(MAX_CHANGES),
  tip_vi: z.string().max(300),
  stronger: z.string().max(1500).optional(),
});
export type Correction = z.infer<typeof correctionSchema>;

export const MODES = ['work', 'interview'] as const;
export type Mode = (typeof MODES)[number];

/** Độ dài câu gửi sửa, tính sau khi trim (SPEC mục 7). */
export const SENTENCE_MIN = 3;
export const SENTENCE_MAX: Record<Mode, number> = { work: 300, interview: 600 };
