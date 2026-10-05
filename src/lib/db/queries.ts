import type { ProgressRepo } from '../progress/handler';
import type { ReviewRepo } from '../review/handler';
import type { Db } from './supabase';
import type { EntitlementRow, LessonProgressRow, ProfileRow, ProfileUpdate } from './types';

/** Lỗi từ Supabase: ghi log ở server rồi ném tiếp, không nuốt (skill code-standards). */
function check<T>(label: string, res: { data: T; error: { message: string } | null }): T {
  if (res.error) {
    console.error(`[db] ${label}: ${res.error.message}`);
    throw new Error(`db: ${label}`);
  }
  return res.data;
}

export async function getProfile(db: Db, userId: string): Promise<ProfileRow | null> {
  return check('getProfile', await db.from('profiles').select('*').eq('id', userId).maybeSingle());
}

export async function getEntitlement(db: Db, userId: string): Promise<EntitlementRow | null> {
  return check('getEntitlement', await db.from('entitlements').select('*').eq('user_id', userId).maybeSingle());
}

export async function getLessonProgress(db: Db, userId: string): Promise<LessonProgressRow[]> {
  return check('getLessonProgress', await db.from('lesson_progress').select('*').eq('user_id', userId)) ?? [];
}

export async function countDueReviews(db: Db, userId: string, now: Date): Promise<number> {
  const res = await db
    .from('review_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lt('box', 5)
    .lte('due_at', now.toISOString());
  check('countDueReviews', res);
  return res.count ?? 0;
}

/** Lỗi đang lặp lại (SPEC mục 5b): mục own_error chưa qua mức 7 ngày. */
export async function countRepeatingErrors(db: Db, userId: string): Promise<number> {
  const res = await db
    .from('review_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', 'own_error')
    .lte('box', 3);
  check('countRepeatingErrors', res);
  return res.count ?? 0;
}

export async function getCorrectionTimes(db: Db, userId: string, since: Date): Promise<Date[]> {
  const rows = check(
    'getCorrectionTimes',
    await db.from('corrections').select('created_at').eq('user_id', userId).gte('created_at', since.toISOString()),
  );
  return (rows ?? []).map((r) => new Date(r.created_at));
}

export async function countCorrections(db: Db, userId: string): Promise<number> {
  const res = await db.from('corrections').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  check('countCorrections', res);
  return res.count ?? 0;
}

export async function updateProfile(db: Db, userId: string, patch: ProfileUpdate): Promise<void> {
  check('updateProfile', await db.from('profiles').update(patch).eq('id', userId));
}

export function progressRepo(db: Db): ProgressRepo {
  return {
    getEntitlement: (userId) => getEntitlement(db, userId),
    async saveLessons(rows) {
      if (rows.length === 0) return;
      check(
        'saveLessons',
        await db.from('lesson_progress').upsert(rows, { onConflict: 'user_id,lesson_key', ignoreDuplicates: true }),
      );
    },
    async saveReviews(rows) {
      if (rows.length === 0) return;
      check(
        'saveReviews',
        await db.from('review_items').upsert(rows, { onConflict: 'user_id,kind,ref', ignoreDuplicates: true }),
      );
    },
  };
}

/** Mục ôn quiz đến hạn, quá hạn lâu nhất lên trước (SPEC mục 5). */
export async function getDueQuizItems(db: Db, userId: string, now: Date, limit: number) {
  return (
    check(
      'getDueQuizItems',
      await db
        .from('review_items')
        .select('id, kind, lesson_key, ref, box, due_at')
        .eq('user_id', userId)
        .eq('kind', 'quiz')
        .lt('box', 5)
        .lte('due_at', now.toISOString())
        .order('due_at', { ascending: true })
        .limit(limit),
    ) ?? []
  );
}

export function reviewRepo(db: Db): ReviewRepo {
  return {
    async getItem(itemId) {
      return check(
        'review.getItem',
        await db.from('review_items').select('id, kind, lesson_key, ref, box, due_at').eq('id', itemId).maybeSingle(),
      );
    },
    async updateItem(itemId, fromBox, next) {
      const rows = check(
        'review.updateItem',
        await db.from('review_items').update(next).eq('id', itemId).eq('box', fromBox).select('id'),
      );
      return rows?.length ?? 0;
    },
  };
}
