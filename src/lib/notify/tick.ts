import type { Lesson, Track } from '../content/schema';
import { errors, ok } from '../http/response';
import { lessonOfTheDay } from '../lesson/today';
import { safeEqual } from '../pay/payos';
import type { ErrorEntry } from '../stats/errors';
import type { Bot } from '../telegram/bot';
import { vnDateKey, vnStartOfDay } from '../time';
import { reminderText, weeklyReportText } from './messages';
import { isReminderDay, isReportTime, reminderRanges, REMIND_FROM_MIN, standupDay, type TimeRange } from './schedule';

export type ReminderCandidate = {
  user_id: string;
  chat_id: number;
  track: Track;
  standup_time: string;
  /** lesson_key các bài đã xong. */
  done: string[];
  /** Đã học xong một bài trong ngày của buổi standup. */
  learned_today: boolean;
};
export type ReportCandidate = { user_id: string; chat_id: number; entries: ErrorEntry[] };

export type TickRepo = {
  /** Một truy vấn nhẹ để project Supabase gói Free không bị tạm dừng (SPEC mục 9). */
  ping(): Promise<void>;
  /** Người đã liên kết Telegram, giờ standup trong `ranges`, chưa được nhắc trong ngày `day`. */
  reminderCandidates(ranges: TimeRange[], day: string, dayStart: Date): Promise<ReminderCandidate[]>;
  /** Ghi reminded_on = day nếu chưa ghi. Trả về false khi lần chạy khác đã nhận người này. */
  claimReminder(userId: string, day: string): Promise<boolean>;
  /** Premium hoặc dùng thử, đã liên kết, có câu sửa trong 14 ngày (để so tuần trước), chưa báo cáo ngày `day`. */
  reportCandidates(now: Date, day: string): Promise<ReportCandidate[]>;
  claimReport(userId: string, day: string): Promise<boolean>;
};

type Input = { request: Request; secret: string | null; bot: Bot | null; repo: TickRepo | null; lessons: readonly Lesson[]; now: Date; site: string };

/**
 * POST /api/cron/tick, gọi bởi worker cron mỗi 15 phút (SPEC mục 9).
 * `?task=report` chạy báo cáo tuần ngay, không chờ Chủ nhật 20:00 (để kiểm tay); vẫn chỉ một tin mỗi ngày.
 */
export async function handleTick({ request, secret, bot, repo, lessons, now, site }: Input): Promise<Response> {
  // 1. Phương thức
  if (request.method !== 'POST') return errors.method();
  // 2. Nguồn gốc: CRON_SECRET trong header Authorization, so sánh thời gian hằng. Sai thì 401, không làm gì.
  const auth = request.headers.get('Authorization') ?? '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return errors.unauthenticated();
  // 3. Danh tính: không có người dùng, đây là việc của hệ thống.
  // 4. Dữ liệu vào
  const task = new URL(request.url).searchParams.get('task');
  if (task !== null && task !== 'report') return errors.badRequest();
  if (!repo) {
    console.error('[api/cron/tick] thiếu SUPABASE_SERVICE_ROLE_KEY');
    return errors.internal();
  }

  // 6. Việc chính
  await repo.ping();
  if (!bot) return ok({ reminders: 0, reports: 0, bot: false });

  let reminders = 0;
  if (task === null && isReminderDay(now)) {
    const day = standupDay(now);
    const standupMoment = new Date(now.getTime() + REMIND_FROM_MIN * 60_000);
    for (const c of await repo.reminderCandidates(reminderRanges(now), day, vnStartOfDay(standupMoment))) {
      if (c.learned_today) continue;
      const today = lessonOfTheDay(lessons, c.track, new Set(c.done), standupMoment);
      if (today.kind !== 'lesson') continue;
      // Ghi "đã nhắc" trước khi gửi: lần chạy trùng không gửi lần hai. Gửi lỗi thì hôm đó bỏ qua.
      if (!(await repo.claimReminder(c.user_id, day))) continue;
      if (await bot.sendMessage(c.chat_id, reminderText(today.lesson, c.standup_time, site))) reminders++;
    }
  }

  let reports = 0;
  if (task === 'report' || isReportTime(now)) {
    const day = vnDateKey(now);
    for (const c of await repo.reportCandidates(now, day)) {
      const text = weeklyReportText(c.entries, now, site);
      if (!text) continue;
      if (!(await repo.claimReport(c.user_id, day))) continue;
      if (await bot.sendMessage(c.chat_id, text)) reports++;
    }
  }

  // 7. Phản hồi
  return ok({ reminders, reports, bot: true });
}
