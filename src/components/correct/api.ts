import { z } from 'zod';
import { correctionSchema, type Mode } from '../../lib/ai/schema';

const dataSchema = z.object({
  id: z.string(),
  original: z.string(),
  result: correctionSchema,
  remaining: z.number(),
  period: z.enum(['day', 'week']),
  review_items: z.number(),
});
export type CorrectData = z.infer<typeof dataSchema>;

const responseSchema = z.union([
  z.object({ ok: z.literal(true), data: dataSchema }),
  z.object({ ok: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) }),
]);

export type CorrectOutcome =
  | { kind: 'ok'; data: CorrectData }
  | { kind: 'login' }
  | { kind: 'error'; code: string; message: string };

export type CorrectRequest = { sentence: string; lessonKey?: string; mode?: Mode; question?: string };

/** Gọi POST /api/correct và kiểm phản hồi bằng zod. Không ném lỗi: mọi trường hợp đều thành một kết quả. */
export async function requestCorrection(body: CorrectRequest): Promise<CorrectOutcome> {
  let res: Response;
  try {
    res = await fetch('/api/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
  } catch {
    return { kind: 'error', code: 'network', message: 'Chưa gửi được do lỗi kết nối. Lượt sửa của bạn chưa bị trừ, bạn thử lại.' };
  }
  if (res.status === 401) return { kind: 'login' };
  const parsed = responseSchema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) {
    return { kind: 'error', code: 'bad_response', message: 'Máy chủ trả về kết quả không đọc được. Bạn thử lại sau ít phút.' };
  }
  if (!parsed.data.ok) return { kind: 'error', ...parsed.data.error };
  return { kind: 'ok', data: parsed.data.data };
}

/** Ctrl hoặc Cmd + Enter trong ô nhập để gửi (skill design-system). */
export function isSubmitKey(e: { key: string; ctrlKey: boolean; metaKey: boolean }): boolean {
  return e.key === 'Enter' && (e.ctrlKey || e.metaKey);
}
