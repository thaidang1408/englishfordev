import { z } from 'zod';

/** Đúng 13 tên ở SPEC mục 10. Database cũng chặn tên khác (events_name_check). */
export const EVENT_NAMES = [
  'page_view',
  'lesson_start',
  'lesson_complete',
  'signup',
  'placement_complete',
  'correction_request',
  'paywall_view',
  'order_create',
  'order_paid',
  'review_complete',
  'telegram_linked',
  'mock_interview_complete',
  'trial_end',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/**
 * Tên trình duyệt được gửi qua POST /api/events. Các tên còn lại do database (trigger) hoặc cron ghi,
 * để không ai giả được đăng ký, sửa câu hay trả tiền.
 */
export const CLIENT_EVENTS = [
  'page_view',
  'lesson_start',
  'lesson_complete',
  'paywall_view',
  'review_complete',
  'mock_interview_complete',
] as const satisfies readonly EventName[];
export type ClientEvent = (typeof CLIENT_EVENTS)[number];

/** props chỉ có lesson_key, src, plan (SPEC mục 10). Không bao giờ có câu người dùng viết. */
export const eventPropsSchema = z.strictObject({
  lesson_key: z
    .string()
    .regex(/^(standup|writing|interview)-\d{2}$/)
    .optional(),
  src: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,40}$/)
    .optional(),
  plan: z.enum(['30d', '90d']).optional(),
});
export type EventProps = z.infer<typeof eventPropsSchema>;

export const eventBodySchema = z.strictObject({
  name: z.enum(CLIENT_EVENTS),
  anon_id: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
  props: eventPropsSchema.default({}),
});
