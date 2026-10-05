import type { Access } from '../auth/access';
import { TRIAL_DAYS } from '../pricing';

/** Số liệu thật của người dùng cho lời mời nâng cấp (SPEC mục 2). */
export type ErrorStats = { corrections: number; errors: number; repeating: number };

/** Ngày thứ 5 của dùng thử bắt đầu sau 4 ngày, tức còn tối đa 3 ngày. */
const CARD_FROM_DAY = 5;

/**
 * Thẻ mời ở /hom-nay: từ ngày thứ 5 của dùng thử cho tới khi nâng cấp, kể cả sau khi dùng thử đã hết.
 * Premium thì không hiện.
 */
export function showTodayCard(access: Access, now: Date): boolean {
  if (access.kind === 'premium') return false;
  if (access.kind === 'free') return true;
  const start = access.until.getTime() - TRIAL_DAYS * 86_400_000;
  const day = Math.floor((now.getTime() - start) / 86_400_000) + 1;
  return day >= CARD_FROM_DAY;
}

/** Câu mở đầu lời mời. Chỉ dùng số liệu khi người dùng thật sự có lỗi được ghi; không có thì không bịa. */
export function upsellHeadline(stats: ErrorStats, fallback: string): string {
  if (stats.errors > 0) return `Sổ lỗi của bạn có ${stats.errors} lỗi, ${stats.repeating} lỗi đang lặp lại`;
  return fallback;
}
