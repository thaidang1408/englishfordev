import type { Lesson } from '../content/schema';
import { accessFrom } from '../auth/access';
import type { EntitlementRow, LessonProgressRow, ReviewItemRow } from '../db/types';
import { errors, ok, sameOrigin } from '../http/response';
import { planSync, syncBodySchema } from './sync';

export type ProgressRepo = {
  getEntitlement(userId: string): Promise<EntitlementRow | null>;
  /** Bài đã xong giữ lần xong đầu tiên: trùng khóa thì bỏ qua. */
  saveLessons(rows: LessonProgressRow[]): Promise<void>;
  /** Mục ôn đã có cho câu đó thì giữ nguyên mức và hạn ôn. */
  saveReviews(rows: Pick<ReviewItemRow, 'user_id' | 'kind' | 'lesson_key' | 'ref' | 'due_at' | 'box'>[]): Promise<void>;
};

type Input = {
  request: Request;
  user: { id: string } | null;
  repo: ProgressRepo;
  lessons: readonly Lesson[];
  now: Date;
  siteUrl?: string;
};

/** POST /api/progress: lưu tiến độ học của khách sau khi đăng nhập, và mỗi lần học xong một bài. */
export async function handleProgress({ request, user, repo, lessons, now, siteUrl }: Input): Promise<Response> {
  // 1. Phương thức
  if (request.method !== 'POST') return errors.method();
  // 2. Nguồn gốc
  if (!sameOrigin(request, siteUrl)) return errors.origin();
  // 3. Danh tính, từ session ở server
  if (!user) return errors.unauthenticated();

  // 4. Dữ liệu vào
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errors.badRequest();
  }
  const body = syncBodySchema.safeParse(json);
  if (!body.success) return errors.badRequest();

  // 5. Quyền: đọc entitlements ngay lúc này
  const access = accessFrom(await repo.getEntitlement(user.id), now);
  const plan = planSync(body.data, lessons, access, user.id, now);
  if (!plan.ok) {
    return plan.reason === 'locked'
      ? errors.forbidden('Bài này cần Premium. Nâng cấp để học tiếp.')
      : errors.badRequest('Tiến độ có bài hoặc câu hỏi không tồn tại.');
  }

  // 6. Việc chính. Hai lệnh ghi đều idempotent, gửi lại không sinh dữ liệu trùng.
  await repo.saveLessons(plan.lessonRows);
  await repo.saveReviews(plan.reviewRows);

  // 7. Phản hồi
  return ok({ lessons: plan.lessonRows.length, reviews: plan.reviewRows.length });
}
