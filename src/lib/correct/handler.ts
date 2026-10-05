import { z } from 'zod';
import { AiError, type CorrectContext, type CorrectSentence } from '../ai/correct';
import { MODES, SENTENCE_MAX, SENTENCE_MIN, type Correction, type Mode } from '../ai/schema';
import { accessFrom, hasFullAccess } from '../auth/access';
import { lessonKey, type Lesson } from '../content/schema';
import type { EntitlementRow } from '../db/types';
import { errors, fail, ok, sameOrigin } from '../http/response';
import { firstDue } from '../review/leitner';
import { vnStartOfDay } from '../time';
import type { ErrorStats } from '../pay/upsell';
import { canInterview, keepsOwnErrors, quotaFor, quotaMessage, SYSTEM_CAP_MESSAGE, type Quota } from './quota';

export const correctBodySchema = z.object({
  // Giới hạn thô trước khi trim; độ dài thật kiểm ở dưới theo mode.
  sentence: z.string().max(2000),
  lessonKey: z
    .string()
    .regex(/^(standup|writing|interview)-\d{2}$/)
    .optional(),
  mode: z.enum(MODES).default('work'),
  question: z.string().max(500).optional(),
});

export type SaveCorrection = {
  user_id: string;
  lesson_key: string | null;
  mode: Mode;
  original: string;
  result: Correction;
  model: string;
  /** Tạo mục ôn own_error cho từng chỗ sửa (Premium và dùng thử). */
  own_errors: boolean;
  due_at: string;
  /** Kiểm lại hạn mức trong cùng giao dịch ghi, để hai request song song không vượt mức. */
  limit: number;
  since: string;
  daily_cap: number;
  cap_since: string;
};

export type SaveResult = { status: 'ok'; id: string } | { status: 'quota' } | { status: 'cap' };

export type CorrectRepo = {
  getEntitlement(userId: string): Promise<EntitlementRow | null>;
  /** Số liệu thật cho lời mời nâng cấp khi tài khoản miễn phí hết lượt (SPEC mục 2). */
  getErrorStats(userId: string): Promise<ErrorStats>;
  countUserCorrections(userId: string, since: Date): Promise<number>;
  /** Tổng số lần sửa toàn hệ thống (AI_DAILY_CALL_CAP). */
  countAllCorrections(since: Date): Promise<number>;
  save(input: SaveCorrection): Promise<SaveResult>;
};

type Input = {
  request: Request;
  user: { id: string } | null;
  /** null khi máy chủ chưa có service role key. */
  repo: CorrectRepo | null;
  /** null khi máy chủ chưa có key AI. */
  correct: CorrectSentence | null;
  model: string;
  lessons: readonly Lesson[];
  now: Date;
  dailyCap: number;
  siteUrl?: string;
};

/**
 * Hết lượt. Tài khoản miễn phí nhận mã riêng để giao diện hiện link nâng cấp; câu mời dùng số liệu
 * của chính người đó, không có lỗi nào được ghi thì không nêu số.
 */
async function quotaExceeded(kind: Quota['kind'], repo: CorrectRepo, userId: string): Promise<Response> {
  if (kind !== 'free') return fail(429, 'quota_exceeded', quotaMessage(kind));
  const stats = await repo.getErrorStats(userId);
  const book = stats.errors > 0 ? ` Sổ lỗi của bạn có ${stats.errors} lỗi, ${stats.repeating} lỗi đang lặp lại.` : '';
  return fail(429, 'free_quota_exceeded', `${quotaMessage(kind)}${book} Nâng cấp để sửa câu mỗi ngày.`);
}

const unavailable = () => fail(503, 'ai_unavailable', 'Tính năng sửa câu đang tạm tắt. Lượt sửa của bạn chưa bị trừ.');

const aiFailed = () =>
  fail(502, 'ai_failed', 'Chưa sửa được câu này. Lượt sửa của bạn chưa bị trừ, bạn thử lại sau ít phút.');

/** POST /api/correct (SPEC mục 7). */
export async function handleCorrect(input: Input): Promise<Response> {
  const { request, user, repo, correct, model, lessons, now, dailyCap, siteUrl } = input;
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
  const body = correctBodySchema.safeParse(json);
  if (!body.success) return errors.badRequest();
  const { mode } = body.data;
  const sentence = body.data.sentence.trim();
  if (sentence.length < SENTENCE_MIN || sentence.length > SENTENCE_MAX[mode]) {
    return errors.badRequest(`Câu cần từ ${SENTENCE_MIN} đến ${SENTENCE_MAX[mode]} ký tự.`);
  }

  let lesson = body.data.lessonKey ? lessons.find((l) => lessonKey(l) === body.data.lessonKey) : undefined;
  if (body.data.lessonKey && !lesson) return errors.badRequest('Không tìm thấy bài học này.');
  let question: string | undefined;
  if (mode === 'interview') {
    // Câu hỏi phải là câu hỏi có trong nội dung, để mode này không thành ô nhập prompt tự do.
    const asked = body.data.question?.trim();
    const source = lessons.find((l) => l.track === 'interview' && l.question_en === asked);
    if (!asked || !source) return errors.badRequest('Câu hỏi phỏng vấn không hợp lệ.');
    question = asked;
    lesson = source;
  }

  if (!repo || !correct) {
    console.error('[api/correct] thiếu', !repo ? 'SUPABASE_SERVICE_ROLE_KEY' : 'ANTHROPIC_API_KEY');
    return unavailable();
  }

  // 5. Quyền và hạn mức, đọc từ database ngay lúc này
  const access = accessFrom(await repo.getEntitlement(user.id), now);
  if (mode === 'interview' && !canInterview(access)) {
    return fail(403, 'premium_required', 'Phỏng vấn thử chỉ có ở Premium và trong 7 ngày dùng thử.');
  }
  if (lesson && !lesson.free && !hasFullAccess(access)) {
    return fail(403, 'premium_required', 'Bài này cần Premium. Nâng cấp để học tiếp.');
  }
  const quota = quotaFor(access, now);
  const used = await repo.countUserCorrections(user.id, quota.since);
  if (used >= quota.limit) return quotaExceeded(quota.kind, repo, user.id);
  const capSince = vnStartOfDay(now);
  if ((await repo.countAllCorrections(capSince)) >= dailyCap) return fail(429, 'system_cap', SYSTEM_CAP_MESSAGE);

  // 6. Việc chính. Lượt chỉ bị trừ khi đã lưu được kết quả hợp lệ.
  const context: CorrectContext = {
    mode,
    question,
    lesson: lesson ? { title: lesson.title, formula: lesson.pattern.formula } : undefined,
  };
  let result: Correction;
  try {
    result = await correct(sentence, context);
  } catch (e) {
    console.error('[api/correct] AI lỗi:', e instanceof AiError ? e.reason : 'không rõ');
    return aiFailed();
  }

  const saved = await repo.save({
    user_id: user.id,
    lesson_key: lesson ? lessonKey(lesson) : null,
    mode,
    original: sentence,
    result,
    model,
    own_errors: keepsOwnErrors(access),
    due_at: firstDue(now).toISOString(),
    limit: quota.limit,
    since: quota.since.toISOString(),
    daily_cap: dailyCap,
    cap_since: capSince.toISOString(),
  });
  if (saved.status === 'quota') return quotaExceeded(quota.kind, repo, user.id);
  if (saved.status === 'cap') return fail(429, 'system_cap', SYSTEM_CAP_MESSAGE);

  // 7. Phản hồi
  return ok({
    id: saved.id,
    original: sentence,
    result,
    remaining: Math.max(0, quota.limit - used - 1),
    period: quota.kind === 'free' ? 'week' : 'day',
    // Số mục ôn own_error vừa tạo, để giao diện nói rõ lỗi đã vào phần ôn hay chưa.
    review_items: keepsOwnErrors(access) ? result.changes.length : 0,
  });
}
