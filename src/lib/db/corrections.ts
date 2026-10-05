import { z } from 'zod';
import { correctionSchema, type Correction, type Mode } from '../ai/schema';
import type { CorrectRepo } from '../correct/handler';
import { getEntitlement } from './queries';
import type { Db } from './supabase';

function check<T>(label: string, res: { data: T; error: { message: string } | null }): T {
  if (res.error) {
    console.error(`[db] ${label}: ${res.error.message}`);
    throw new Error(`db: ${label}`);
  }
  return res.data;
}

const saveResultSchema = z.union([
  z.object({ status: z.literal('ok'), id: z.uuid() }),
  z.object({ status: z.literal('quota') }),
  z.object({ status: z.literal('cap') }),
]);

/**
 * `db` là client theo session của người dùng (RLS). `service` là client service role,
 * chỉ dùng để đếm tổng lượt toàn hệ thống và gọi hàm ghi save_correction.
 */
export function correctRepo(db: Db, service: Db): CorrectRepo {
  return {
    getEntitlement: (userId) => getEntitlement(db, userId),
    async countUserCorrections(userId, since) {
      const res = await db
        .from('corrections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since.toISOString());
      check('countUserCorrections', res);
      return res.count ?? 0;
    },
    async countAllCorrections(since) {
      const res = await service
        .from('corrections')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since.toISOString());
      check('countAllCorrections', res);
      return res.count ?? 0;
    },
    async save(input) {
      const data = check(
        'save_correction',
        await service.rpc('save_correction', {
          p_user_id: input.user_id,
          p_lesson_key: input.lesson_key,
          p_mode: input.mode,
          p_original: input.original,
          p_result: input.result,
          p_model: input.model,
          p_own_errors: input.own_errors,
          p_due_at: input.due_at,
          p_limit: input.limit,
          p_since: input.since,
          p_daily_cap: input.daily_cap,
          p_cap_since: input.cap_since,
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
