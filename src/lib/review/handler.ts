import { z } from 'zod';
import type { Lesson } from '../content/schema';
import type { ReviewItemRow } from '../db/types';
import { errors, fail, ok, sameOrigin } from '../http/response';
import { findQuizItem } from './content';
import { isDue, nextState } from './leitner';

export const reviewBodySchema = z.object({
  item_id: z.uuid(),
  // Vị trí đáp án gốc người dùng chọn. Server tự chấm, không nhận "đúng/sai" từ client.
  choice: z.number().int().min(0).max(2),
});

export type ReviewRepo = {
  /** Đọc bằng session của người dùng: RLS chỉ trả về mục của chính họ. */
  getItem(itemId: string): Promise<Pick<ReviewItemRow, 'id' | 'kind' | 'lesson_key' | 'ref' | 'box' | 'due_at'> | null>;
  /** Cập nhật khi mức hiện tại vẫn là `fromBox`, để hai lần gửi trùng không lên hai mức. Trả về số dòng đổi. */
  updateItem(itemId: string, fromBox: number, next: { box: number; due_at: string }): Promise<number>;
};

type Input = { request: Request; user: { id: string } | null; repo: ReviewRepo; lessons: readonly Lesson[]; now: Date; siteUrl?: string };

/** POST /api/review: chấm một câu trong phiên ôn và chuyển mức Leitner. */
export async function handleReview({ request, user, repo, lessons, now, siteUrl }: Input): Promise<Response> {
  // 1. Phương thức
  if (request.method !== 'POST') return errors.method();
  // 2. Nguồn gốc
  if (!sameOrigin(request, siteUrl)) return errors.origin();
  // 3. Danh tính
  if (!user) return errors.unauthenticated();

  // 4. Dữ liệu vào
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errors.badRequest();
  }
  const body = reviewBodySchema.safeParse(json);
  if (!body.success) return errors.badRequest();

  // 5. Quyền: chỉ thấy mục của mình (RLS). own_error thuộc M4 và cần Premium.
  const item = await repo.getItem(body.data.item_id);
  if (!item) return fail(404, 'not_found', 'Không tìm thấy câu ôn này.');
  if (item.kind !== 'quiz') return errors.forbidden('Loại câu ôn này chưa mở.');
  if (!isDue(item, now)) return fail(409, 'not_due', 'Câu này chưa đến hạn ôn.');

  const found = findQuizItem(lessons, item.lesson_key, item.ref);
  if (!found) return fail(404, 'not_found', 'Không tìm thấy câu hỏi gốc của câu ôn này.');

  // 6. Việc chính
  const correct = body.data.choice === found.item.answer;
  const next = nextState(item.box, correct, now);
  const changed = await repo.updateItem(item.id, item.box, next);
  if (changed === 0) return fail(409, 'not_due', 'Câu này vừa được chấm rồi.');

  // 7. Phản hồi
  return ok({ correct, box: next.box, due_at: next.due_at });
}
