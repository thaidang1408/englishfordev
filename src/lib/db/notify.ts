import { correctionSchema } from '../ai/schema';
import { accessFrom, hasFullAccess } from '../auth/access';
import type { ReminderCandidate, ReportCandidate, TickRepo } from '../notify/tick';
import type { TelegramRepo } from '../telegram/webhook';
import { addDaysTo } from '../time';
import type { Db } from './supabase';

function check<T>(label: string, res: { data: T; error: { message: string } | null }): T {
  if (res.error) {
    console.error(`[db] ${label}: ${res.error.message}`);
    throw new Error(`db: ${label}`);
  }
  return res.data;
}

const newLinkToken = () => crypto.randomUUID().replaceAll('-', '');

/** Mọi hàm ở đây chạy bằng service role: không có session người dùng (webhook, cron). */
export function telegramRepo(service: Db, adminEmails: readonly string[]): TelegramRepo {
  return {
    async linkChat(token, chatId) {
      const owner = check('linkChat.find', await service.from('profiles').select('id').eq('telegram_link_token', token).maybeSingle());
      if (!owner) return false;
      // Một chat chỉ gắn một tài khoản: gỡ khỏi tài khoản cũ trước. Đổi mã để link cũ không dùng lại được.
      check(
        'linkChat.release',
        await service.from('profiles').update({ telegram_chat_id: null }).eq('telegram_chat_id', chatId).neq('id', owner.id),
      );
      check(
        'linkChat.set',
        await service.from('profiles').update({ telegram_chat_id: chatId, telegram_link_token: newLinkToken() }).eq('id', owner.id),
      );
      return true;
    },
    async unlinkChat(chatId) {
      const rows = check(
        'unlinkChat',
        await service.from('profiles').update({ telegram_chat_id: null }).eq('telegram_chat_id', chatId).select('id'),
      );
      return (rows?.length ?? 0) > 0;
    },
    async isLinked(chatId) {
      const row = check('isLinked', await service.from('profiles').select('id').eq('telegram_chat_id', chatId).maybeSingle());
      return row !== null;
    },
    async adminChatIds() {
      if (adminEmails.length === 0) return [];
      const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw new Error('db: adminChatIds.users');
      const ids = data.users.filter((u) => u.email && adminEmails.includes(u.email.toLowerCase())).map((u) => u.id);
      if (ids.length === 0) return [];
      const rows = check(
        'adminChatIds',
        await service.from('profiles').select('telegram_chat_id').in('id', ids).not('telegram_chat_id', 'is', null),
      );
      return (rows ?? []).flatMap((r) => (r.telegram_chat_id === null ? [] : [r.telegram_chat_id]));
    },
  };
}

export function tickRepo(service: Db): TickRepo {
  return {
    async ping() {
      check('ping', await service.from('profiles').select('id', { head: true, count: 'estimated' }).limit(1));
    },
    async reminderCandidates(ranges, day, dayStart): Promise<ReminderCandidate[]> {
      // Trong or() của PostgREST, dấu ":" là ký tự dành riêng nên giá trị giờ đặt trong ngoặc kép.
      const timeFilter = ranges.map((r) => `and(standup_time.gte."${r.from}",standup_time.lt."${r.to}")`).join(',');
      // Lọc khung giờ trong truy vấn, lọc "chưa nhắc hôm nay" ở đây (một bộ lọc or mỗi truy vấn).
      // claimReminder vẫn là chốt chặn chống gửi trùng.
      const profiles = (
        check(
          'reminderCandidates',
          await service
            .from('profiles')
            .select('id, telegram_chat_id, track, standup_time, reminded_on')
            .not('telegram_chat_id', 'is', null)
            .or(timeFilter),
        ) ?? []
      ).filter((p) => p.reminded_on === null || p.reminded_on < day);
      if (profiles.length === 0) return [];
      const progress =
        check(
          'reminderCandidates.progress',
          await service
            .from('lesson_progress')
            .select('user_id, lesson_key, completed_at')
            .in(
              'user_id',
              profiles.map((p) => p.id),
            ),
        ) ?? [];
      return profiles.flatMap((p) => {
        if (p.telegram_chat_id === null) return [];
        const mine = progress.filter((r) => r.user_id === p.id);
        return [
          {
            user_id: p.id,
            chat_id: p.telegram_chat_id,
            track: p.track,
            standup_time: p.standup_time,
            done: mine.map((r) => r.lesson_key),
            learned_today: mine.some((r) => Date.parse(r.completed_at) >= dayStart.getTime()),
          },
        ];
      });
    },
    async claimReminder(userId, day) {
      const rows = check(
        'claimReminder',
        await service
          .from('profiles')
          .update({ reminded_on: day })
          .eq('id', userId)
          .or(`reminded_on.is.null,reminded_on.lt.${day}`)
          .select('id'),
      );
      return (rows?.length ?? 0) > 0;
    },
    async reportCandidates(now, day): Promise<ReportCandidate[]> {
      const profiles =
        check(
          'reportCandidates',
          await service
            .from('profiles')
            .select('id, telegram_chat_id')
            .not('telegram_chat_id', 'is', null)
            .or(`reported_on.is.null,reported_on.lt.${day}`),
        ) ?? [];
      if (profiles.length === 0) return [];
      const ids = profiles.map((p) => p.id);
      const ents =
        check('reportCandidates.ent', await service.from('entitlements').select('user_id, premium_until, trial_until').in('user_id', ids)) ?? [];
      const full = new Set(ents.filter((e) => hasFullAccess(accessFrom(e, now))).map((e) => e.user_id));
      const fullIds = ids.filter((id) => full.has(id));
      if (fullIds.length === 0) return [];
      const rows =
        check(
          'reportCandidates.corrections',
          await service
            .from('corrections')
            .select('user_id, original, result, created_at')
            .in('user_id', fullIds)
            .gte('created_at', addDaysTo(now, -14).toISOString()),
        ) ?? [];
      return profiles.flatMap((p) => {
        if (!full.has(p.id) || p.telegram_chat_id === null) return [];
        const entries = rows.flatMap((r) => {
          if (r.user_id !== p.id) return [];
          const result = correctionSchema.safeParse(r.result);
          return result.success ? [{ created_at: r.created_at, original: r.original, result: result.data }] : [];
        });
        return entries.length > 0 ? [{ user_id: p.id, chat_id: p.telegram_chat_id, entries }] : [];
      });
    },
    async claimReport(userId, day) {
      const rows = check(
        'claimReport',
        await service
          .from('profiles')
          .update({ reported_on: day })
          .eq('id', userId)
          .or(`reported_on.is.null,reported_on.lt.${day}`)
          .select('id'),
      );
      return (rows?.length ?? 0) > 0;
    },
  };
}
