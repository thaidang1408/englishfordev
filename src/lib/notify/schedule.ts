import { isVnWeekend, vnDateKey, vnWeekday } from '../time';

/**
 * Lịch gửi tin (SPEC mục 9), hàm thuần, thời điểm được tiêm vào.
 * Cron chạy mỗi 15 phút; mỗi lần tìm người có giờ standup nằm trong 30 đến 45 phút tới.
 */
export const REMIND_FROM_MIN = 30;
export const REMIND_TO_MIN = 45;
const VN_OFFSET_MIN = 7 * 60;
const DAY_MIN = 24 * 60;

export type TimeRange = { from: string; to: string };

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00`;

/** Khoảng giờ standup (giờ Việt Nam, dạng HH:MM:SS, `to` không tính) cần nhắc lúc `now`. Qua nửa đêm thì tách hai khoảng. */
export function reminderRanges(now: Date): TimeRange[] {
  const nowMin = (now.getUTCHours() * 60 + now.getUTCMinutes() + VN_OFFSET_MIN) % DAY_MIN;
  const from = (nowMin + REMIND_FROM_MIN) % DAY_MIN;
  const to = from + (REMIND_TO_MIN - REMIND_FROM_MIN);
  if (to <= DAY_MIN) return [{ from: hhmm(from), to: to === DAY_MIN ? '24:00:00' : hhmm(to) }];
  return [
    { from: hhmm(from), to: '24:00:00' },
    { from: '00:00:00', to: hhmm(to - DAY_MIN) },
  ];
}

/** Ngày (giờ Việt Nam) của buổi standup sắp tới, dùng làm "hôm nay" khi chống nhắc trùng. */
export function standupDay(now: Date): string {
  return vnDateKey(new Date(now.getTime() + REMIND_FROM_MIN * 60_000));
}

/** Chỉ nhắc từ thứ Hai đến thứ Sáu, theo ngày của buổi standup. */
export function isReminderDay(now: Date): boolean {
  return !isVnWeekend(new Date(now.getTime() + REMIND_FROM_MIN * 60_000));
}

/** Báo cáo tuần: Chủ nhật, trong giờ 20 (giờ Việt Nam). Cả giờ để lỡ một lần cron vẫn gửi được; chống trùng bằng reported_on. */
export function isReportTime(now: Date): boolean {
  const vn = new Date(now.getTime() + VN_OFFSET_MIN * 60_000);
  return vnWeekday(now) === 0 && vn.getUTCHours() === 20;
}

/** Số ngày từ hôm nay (giờ Việt Nam) tới ngày phỏng vấn. Đã qua thì null. */
export function daysUntil(dateKey: string, now: Date): number | null {
  const today = Date.parse(`${vnDateKey(now)}T00:00:00Z`);
  const target = Date.parse(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(target) || target < today) return null;
  return Math.round((target - today) / 86_400_000);
}

