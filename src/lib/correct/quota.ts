import type { Access } from '../auth/access';
import { addDaysTo, vnStartOfDay } from '../time';

/**
 * Hạn mức sửa câu (SPEC mục 2 và 7), đếm từ bảng corrections:
 * Premium 30 lần hôm nay, dùng thử 10 lần hôm nay, còn lại 1 lần trong 7 ngày gần nhất.
 * "Hôm nay" tính theo giờ Việt Nam.
 */
export const LIMITS = { premium: 30, trial: 10, free: 1 } as const;
export const FREE_WINDOW_DAYS = 7;
export const DEFAULT_DAILY_CAP = 500;

export type Quota = { kind: Access['kind']; limit: number; since: Date };

export function quotaFor(access: Access, now: Date): Quota {
  if (access.kind === 'free') return { kind: 'free', limit: LIMITS.free, since: addDaysTo(now, -FREE_WINDOW_DAYS) };
  return { kind: access.kind, limit: LIMITS[access.kind], since: vnStartOfDay(now) };
}

/** Phỏng vấn thử và mode interview chỉ cho Premium và dùng thử. */
export function canInterview(access: Access): boolean {
  return access.kind !== 'free';
}

/** Mục ôn own_error chỉ tạo cho Premium và dùng thử. */
export function keepsOwnErrors(access: Access): boolean {
  return access.kind !== 'free';
}

export function quotaMessage(kind: Access['kind']): string {
  switch (kind) {
    case 'premium':
      return `Bạn đã sửa đủ ${LIMITS.premium} câu hôm nay. Ngày mai bạn sửa tiếp được.`;
    case 'trial':
      return `Trong thời gian dùng thử, bạn sửa được ${LIMITS.trial} câu mỗi ngày. Hôm nay đã đủ, ngày mai bạn sửa tiếp được.`;
    case 'free':
      return 'Tài khoản miễn phí sửa được 1 câu mỗi 7 ngày. Bạn đã dùng lượt của 7 ngày này.';
  }
}

export const SYSTEM_CAP_MESSAGE = 'Hôm nay hệ thống đã hết lượt, thử lại ngày mai.';
