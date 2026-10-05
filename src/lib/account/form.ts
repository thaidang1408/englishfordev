import { z } from 'zod';
import type { ProfileUpdate } from '../db/types';

/** Form ở /tai-khoan. Ngày phỏng vấn không bắt buộc, để trống là xóa. */
export const accountFormSchema = z.object({
  standup_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  interview_date: z.union([z.literal(''), z.iso.date()]),
});

export function parseAccountForm(form: FormData, now: Date): ProfileUpdate | null {
  const result = accountFormSchema.safeParse(Object.fromEntries(form));
  if (!result.success) return null;
  const { standup_time, interview_date } = result.data;
  if (interview_date) {
    // Ngày phỏng vấn phải trong khoảng một năm tới, tính cả hôm qua để chịu được lệch múi giờ.
    const t = Date.parse(`${interview_date}T00:00:00Z`);
    if (t < now.getTime() - 2 * 86_400_000 || t > now.getTime() + 366 * 86_400_000) return null;
  }
  return { standup_time, interview_date: interview_date || null };
}
