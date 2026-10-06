import { z } from 'zod';
import { correctionSchema, type Correction, type Mode } from '../ai/schema';
import { roleSchema } from '../content/roles';

const rolesSchema = z.array(roleSchema);
import type { CorrectRepo } from '../correct/handler';
import type { ErrorStats } from '../pay/upsell';
import { countRepeatingErrors, getEntitlement } from './queries';
import type { Db } from './supabase';

function check<T>(label: string, res: { data: T; error: { message: string } | null }): T {
  if (res.error) {
    console.error(`[db] ${label}: ${res.error.message}`);
    throw new Error(`db: ${label}`);
  }
  return res.data;
}

const reserveResultSchema = z.union([
  z.object({ status: z.literal('ok'), id: z.uuid(), used: z.number().int() }),
  z.object({ status: z.literal('busy') }),
  z.object({ status: z.literal('quota') }),
  z.object({ status: z.literal('cap') }),
]);
const saveResultSchema = z.object({ status: z.literal('ok'), id: z.uuid() });

/**
 * `db` là client theo session của người dùng (RLS). `service` là client service role,
 * chỉ dùng để gọi các hàm reserve_ai_call, release_ai_call, save_correction.
 */
export function correctRepo(db: Db, service: Db): CorrectRepo {
  return {
    getEntitlement: (userId) => getEntitlement(db, userId),
    async getRoles(userId) {
      const row = check('getRoles', await db.from('profiles').select('roles').eq('id', userId).maybeSingle());
      return rolesSchema.catch([]).parse(row?.roles ?? []);
    },
    getErrorStats: (userId) => getErrorStats(db, userId),
    async reserve(input) {
      const data = check(
        'reserve_ai_call',
        await service.rpc('reserve_ai_call', {
          p_user_id: input.user_id,
          p_limit: input.limit,
          p_since: input.since,
          p_daily_cap: input.daily_cap,
          p_premium: input.premium,
          p_cap_since: input.cap_since,
        }),
      );
      return reserveResultSchema.parse(data);
    },
    async release(reservationId) {
      check('release_ai_call', await service.rpc('release_ai_call', { p_reservation_id: reservationId }));
    },
    async save(input) {
      const data = check(
        'save_correction',
        await service.rpc('save_correction', {
          p_reservation_id: input.reservation_id,
          p_lesson_key: input.lesson_key,
          p_mode: input.mode,
          p_original: input.original,
          p_result: input.result,
          p_model: input.model,
          p_own_errors: input.own_errors,
          p_due_at: input.due_at,
        }),
      );
      return saveResultSchema.parse(data);
    },
  };
}

export type CorrectionEntry = {
  id: string;
  lesson_key: string | null;
  mode: Mode;
  original: string;
  result: Correction;
  created_at: string;
};

/** Đọc các lần sửa của người dùng (RLS), mới nhất trước. Dòng có result hỏng thì bỏ qua. */
export async function getCorrections(
  db: Db,
  userId: string,
  opts: { since?: Date; limit: number },
): Promise<CorrectionEntry[]> {
  let q = db
    .from('corrections')
    .select('id, lesson_key, mode, original, result, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(opts.limit);
  if (opts.since) q = q.gte('created_at', opts.since.toISOString());
  const rows = check('getCorrections', await q) ?? [];
  return rows.flatMap((r) => {
    const result = correctionSchema.safeParse(r.result);
    return result.success ? [{ ...r, result: result.data }] : [];
  });
}

/** Số liệu cho lời mời nâng cấp: số câu đã sửa, tổng số lỗi đã ghi, số lỗi đang lặp lại. */
export async function getErrorStats(db: Db, userId: string): Promise<ErrorStats> {
  const [rows, repeating] = await Promise.all([
    db.from('corrections').select('result').eq('user_id', userId).limit(1000),
    countRepeatingErrors(db, userId),
  ]);
  const list = check('getErrorStats', rows) ?? [];
  const errors = list.reduce((n, r) => {
    const parsed = correctionSchema.safeParse(r.result);
    return n + (parsed.success ? parsed.data.changes.length : 0);
  }, 0);
  return { corrections: list.length, errors, repeating };
}
