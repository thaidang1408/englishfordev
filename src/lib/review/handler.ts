import { z } from 'zod';
import type { Lesson } from '../content/schema';
import { accessFrom, hasFullAccess } from '../auth/access';
import type { EntitlementRow, ReviewItemRow } from '../db/types';
import { errors, fail, ok, sameOrigin } from '../http/response';
import { findQuizItem } from './content';
import { isDue, nextState } from './leitner';

export const reviewBodySchema = z.union([
  z.strictObject({
    item_id: z.uuid(),
    // Mục quiz: vị trí đáp án gốc người dùng chọn. Server tự chấm, không nhận "đúng/sai" từ client.
    choice: z.number().int().min(0).max(2),
  }),
  z.strictObject({
    item_id: z.uuid(),
    // Mục own_error: người dùng tự chấm "nhớ" hoặc "chưa nhớ" sau khi xem đáp án (SPEC mục 5).
    remembered: z.boolean(),
  }),
]);

export type ReviewRepo = {
  /** Đọc bằng session của người dùng: RLS chỉ trả về mục của chính họ. */
  getItem(itemId: string): Promise<Pick<ReviewItemRow, 'id' | 'kind' | 'lesson_key' | 'ref' | 'box' | 'due_at'> | null>;
  /** Cập nhật khi mức hiện tại vẫn là `fromBox`, để hai lần gửi trùng không lên hai mức. Trả về số dòng đổi. */
  updateItem(itemId: string, fromBox: number, next: { box: number; due_at: string }): Promise<number>;
  getEntitlement(userId: string): Promise<EntitlementRow | null>;
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

  // 5. Quyền: chỉ thấy mục của mình (RLS). Ôn lỗi của chính mình (own_error) chỉ cho Premium và dùng thử.
  const item = await repo.getItem(body.data.item_id);
  if (!item) return fail(404, 'not_found', 'Không tìm thấy câu ôn này.');
  if (!isDue(item, now)) return fail(409, 'not_due', 'Câu này chưa đến hạn ôn.');

  let correct: boolean;
  if (item.kind === 'quiz') {
    if (!('choice' in body.data)) return errors.badRequest();
    const found = findQuizItem(lessons, item.lesson_key, item.ref);
    if (!found) return fail(404, 'not_found', 'Không tìm thấy câu hỏi gốc của câu ôn này.');
    correct = body.data.choice === found.item.answer;
  } else {
    if (!('remembered' in body.data)) return errors.badRequest();
    const access = accessFrom(await repo.getEntitlement(user.id), now);
    if (!hasFullAccess(access)) {
      return fail(403, 'premium_required', 'Ôn lỗi của chính bạn chỉ có ở Premium và trong 7 ngày dùng thử.');
    }
    correct = body.data.remembered;
  }

  // 6. Việc chính
  const next = nextState(item.box, correct, now);
  const changed = await repo.updateItem(item.id, item.box, next);
  if (changed === 0) return fail(409, 'not_due', 'Câu này vừa được chấm rồi.');

  // 7. Phản hồi
  return ok({ correct, box: next.box, due_at: next.due_at });
}
