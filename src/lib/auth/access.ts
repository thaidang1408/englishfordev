import type { EntitlementRow } from '../db/types';

export type Access =
  | { kind: 'premium'; until: Date }
  | { kind: 'trial'; until: Date }
  | { kind: 'free'; trialEndedAt: Date | null };

/**
 * SPEC mục 8: Premium khi premium_until > now. Dùng thử khi không Premium và trial_until > now.
 * Luôn tính ở server từ dòng entitlements vừa đọc.
 */
export function accessFrom(ent: Pick<EntitlementRow, 'premium_until' | 'trial_until'> | null, now: Date): Access {
  const premium = ent?.premium_until ? new Date(ent.premium_until) : null;
  const trial = ent?.trial_until ? new Date(ent.trial_until) : null;
  if (premium && premium > now) return { kind: 'premium', until: premium };
  if (trial && trial > now) return { kind: 'trial', until: trial };
  return { kind: 'free', trialEndedAt: trial };
}

/** Premium và dùng thử có cùng quyền nội dung. */
export function hasFullAccess(access: Access): boolean {
  return access.kind !== 'free';
}
