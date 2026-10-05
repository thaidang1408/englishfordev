import { z } from 'zod';

const cohort = z.object({ cohort: z.number().int(), returned: z.number().int() });

/** Kết quả hàm admin_funnel trong database (migration 20261005190000). */
export const funnelSchema = z.object({
  visitors: z.number().int(),
  lesson1_start: z.number().int(),
  lesson1_complete: z.number().int(),
  signup: z.number().int(),
  placement: z.number().int(),
  first_correction: z.number().int(),
  order_create: z.number().int(),
  order_paid: z.number().int(),
  retention: z.object({ d1: cohort.optional(), d7: cohort.optional(), d30: cohort.optional() }),
});
export type Funnel = z.infer<typeof funnelSchema>;

/** Các bước phễu theo SPEC mục 10, đúng thứ tự. */
export const FUNNEL_STEPS = [
  ['visitors', 'Khách'],
  ['lesson1_start', 'Bắt đầu bài 1'],
  ['lesson1_complete', 'Xong bài 1'],
  ['signup', 'Đăng ký'],
  ['placement', 'Xong test xếp trình độ'],
  ['first_correction', 'Sửa câu lần đầu'],
  ['order_create', 'Tạo đơn'],
  ['order_paid', 'Trả tiền'],
] as const satisfies readonly (readonly [Exclude<keyof Funnel, 'retention'>, string])[];

/** Tỷ lệ phần trăm làm tròn, hoặc gạch ngang khi mẫu số bằng 0 (không bịa số). */
export function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '–';
}
