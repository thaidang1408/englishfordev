import { describe, expect, it } from 'vitest';
import { accessFrom } from '../../src/lib/auth/access';
import { showTodayCard, upsellHeadline } from '../../src/lib/pay/upsell';

const signup = new Date('2026-10-01T03:00:00Z');
const trialUntil = new Date(signup.getTime() + 7 * 86_400_000).toISOString();
const at = (day: number) => new Date(signup.getTime() + (day - 1) * 86_400_000 + 3600_000);
const ent = (over: { premium_until?: string | null; trial_until?: string | null } = {}) => ({
  premium_until: null,
  trial_until: trialUntil,
  ...over,
});

describe('thẻ mời nâng cấp ở /hom-nay', () => {
  it('ngày 1 đến 4 của dùng thử: không hiện; từ ngày 5: hiện', () => {
    for (const day of [1, 2, 3, 4]) expect(showTodayCard(accessFrom(ent(), at(day)), at(day)), `ngày ${day}`).toBe(false);
    for (const day of [5, 6, 7]) expect(showTodayCard(accessFrom(ent(), at(day)), at(day)), `ngày ${day}`).toBe(true);
  });

  it('hết dùng thử vẫn hiện; Premium thì không', () => {
    expect(showTodayCard(accessFrom(ent(), at(12)), at(12))).toBe(true);
    const paid = ent({ premium_until: '2026-12-01T00:00:00Z' });
    expect(showTodayCard(accessFrom(paid, at(6)), at(6))).toBe(false);
  });

  it('đặt trial_until về quá khứ: mất quyền Premium ngay', () => {
    const now = at(3);
    expect(accessFrom(ent({ trial_until: new Date(now.getTime() - 60_000).toISOString() }), now).kind).toBe('free');
  });
});

describe('câu mời', () => {
  it('có lỗi được ghi thì dùng số liệu thật', () => {
    expect(upsellHeadline({ corrections: 5, errors: 14, repeating: 5 }, 'x')).toBe('Sổ lỗi của bạn có 14 lỗi, 5 lỗi đang lặp lại');
  });

  it('chưa có lỗi nào thì không bịa số', () => {
    expect(upsellHeadline({ corrections: 2, errors: 0, repeating: 0 }, 'Bài này có ở Premium')).toBe('Bài này có ở Premium');
  });
});
