import type { Lesson } from '../content/schema';
import { lessonKey } from '../content/schema';
import { accessFrom } from '../auth/access';
import type { EntitlementRow, LessonProgressRow, ReviewItemRow } from '../db/types';
import { errors, ok, sameOrigin } from '../http/response';
import { planSync, syncBodySchema } from './sync';

export type ProgressRepo = {
  getEntitlement(userId: string): Promise<EntitlementRow | null>;
  getLesson(userId: string, key: string): Promise<LessonProgressRow | null>;
  /** Lần học xong mới nhất ghi đè điểm và thời điểm xong. */
  saveLessons(rows: LessonProgressRow[]): Promise<void>;
  /** Câu sai: tạo mục ôn mới, hoặc đưa mục đã có về mức 1 với hạn ôn trong `rows`. */
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

/**
 * /api/progress
 * - GET ?lesson=standup-01: kết quả bài đó của tài khoản đang đăng nhập (trang bài học là trang tĩnh nên hỏi qua đây).
 * - POST: lưu kết quả một lần học xong, hoặc tiến độ của khách khi lần đầu đăng nhập.
 */
export async function handleProgress(input: Input): Promise<Response> {
  // 1. Phương thức
  if (input.request.method === 'GET') return handleGet(input);
  if (input.request.method === 'POST') return handlePost(input);
  return errors.method();
}

async function handleGet({ request, user, repo, lessons }: Input): Promise<Response> {
  // 2. Nguồn gốc: GET không đổi dữ liệu và phản hồi không cache, không cần kiểm Origin.
  // 3. Danh tính
  if (!user) return errors.unauthenticated();
  // 4. Dữ liệu vào
  const key = new URL(request.url).searchParams.get('lesson');
  if (!key || !lessons.some((l) => lessonKey(l) === key)) return errors.badRequest('Không có bài này.');
  // 5. Quyền: RLS chỉ trả về dòng của chính người dùng. 6. Việc chính
  const row = await repo.getLesson(user.id, key);
  // 7. Phản hồi
  return ok({ lesson_key: key, completed: row ? { score: row.score, completed_at: row.completed_at } : null });
}

async function handlePost({ request, user, repo, lessons, now, siteUrl }: Input): Promise<Response> {
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

  // 6. Việc chính
  await repo.saveLessons(plan.lessonRows);
  await repo.saveReviews(plan.reviewRows);

  // 7. Phản hồi
  return ok({ lessons: plan.lessonRows.length, reviews: plan.reviewRows.length });
}
