/** Ngày giờ lưu UTC. "Hôm nay" và thứ trong tuần luôn tính theo giờ Việt Nam. */
export const VN_TZ = 'Asia/Ho_Chi_Minh';
const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // Việt Nam không đổi giờ theo mùa.
const DAY_MS = 24 * 60 * 60 * 1000;

/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function vnDateKey(d: Date): string {
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** 0 = Chủ nhật ... 6 = thứ Bảy, theo giờ Việt Nam. */
export function vnWeekday(d: Date): number {
  return new Date(d.getTime() + VN_OFFSET_MS).getUTCDay();
}

export function isVnWeekend(d: Date): boolean {
  const w = vnWeekday(d);
  return w === 0 || w === 6;
}

/** Cộng `days` ngày vào một khóa ngày YYYY-MM-DD. */
export function addDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function addDaysTo(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

/** Số ngày từ hôm nay (giờ Việt Nam) tới hết `until`, làm tròn lên. Đã qua thì 0. */
export function daysLeft(until: Date, now: Date): number {
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / DAY_MS));
}

export function formatVnDate(d: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}
