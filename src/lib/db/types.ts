import type { Role } from '../content/roles';
import type { EventName } from '../events/schema';

/**
 * Kiểu bảng theo supabase/migrations, dạng supabase-js cần.
 * Sửa migration thì sửa cả file này (skill db-change).
 */
type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Level = 'basic' | 'intermediate' | 'good';
export type WeakArea = 'reading' | 'grammar' | 'polite';
export type TrackName = 'standup' | 'writing' | 'interview';

export type ProfileRow = {
  id: string;
  display_name: string | null;
  level: Level | null;
  weak_area: WeakArea | null;
  track: TrackName;
  standup_time: string;
  interview_date: string | null;
  telegram_chat_id: number | null;
  telegram_link_token: string | null;
  created_at: string;
  reminded_on: string | null;
  reported_on: string | null;
  roles: Role[];
};
export type ProfileUpdate = Partial<
  Pick<ProfileRow, 'display_name' | 'level' | 'weak_area' | 'track' | 'standup_time' | 'interview_date' | 'roles'>
>;

/** Cột chỉ server ghi (service role): liên kết Telegram, ngày đã nhắc, ngày đã báo cáo. */
export type ServerProfileUpdate = ProfileUpdate &
  Partial<Pick<ProfileRow, 'telegram_chat_id' | 'telegram_link_token' | 'reminded_on' | 'reported_on'>>;

export type EntitlementRow = { user_id: string; premium_until: string | null; trial_until: string | null };

export type LessonProgressRow = { user_id: string; lesson_key: string; score: number; completed_at: string };

export type ReviewItemRow = {
  id: string;
  user_id: string;
  kind: 'quiz' | 'own_error';
  lesson_key: string | null;
  ref: string;
  payload: unknown;
  box: number;
  due_at: string;
  created_at: string;
};
type ReviewItemInsert = Pick<ReviewItemRow, 'user_id' | 'kind' | 'ref' | 'due_at'> &
  Partial<Pick<ReviewItemRow, 'lesson_key' | 'payload' | 'box'>>;

export type CorrectionRow = {
  id: string;
  user_id: string;
  lesson_key: string | null;
  mode: 'work' | 'interview';
  original: string;
  result: unknown;
  model: string;
  created_at: string;
};

export type OrderPlan = '30d' | '90d';
export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'expired';
export type OrderRow = {
  id: string;
  user_id: string;
  code: string;
  plan: OrderPlan;
  amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  order_number: number;
  checkout_url: string | null;
  qr_code: string | null;
  bank_ref: string | null;
  paid_by: string | null;
};
export type EventRow = {
  id: number;
  user_id: string | null;
  anon_id: string | null;
  name: EventName;
  props: Json | null;
  created_at: string;
};

type OrderInsert = Pick<OrderRow, 'user_id' | 'code' | 'plan' | 'amount'>;
type OrderUpdate = Partial<Pick<OrderRow, 'checkout_url' | 'qr_code' | 'status'>>;

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, never, ServerProfileUpdate>;
      entitlements: Table<EntitlementRow, never, never>;
      lesson_progress: Table<LessonProgressRow, Omit<LessonProgressRow, 'completed_at'> & { completed_at?: string }>;
      review_items: Table<ReviewItemRow, ReviewItemInsert, Partial<Pick<ReviewItemRow, 'box' | 'due_at'>>>;
      corrections: Table<CorrectionRow, never, never>;
      orders: Table<OrderRow, OrderInsert, OrderUpdate>;
      events: Table<EventRow, Omit<EventRow, 'id' | 'created_at'>, never>;
    };
    Views: Record<string, never>;
    Functions: {
      save_correction: {
        Args: {
          p_reservation_id: string;
          p_lesson_key: string | null;
          p_mode: 'work' | 'interview';
          p_original: string;
          p_result: Json;
          p_model: string;
          p_own_errors: boolean;
          p_due_at: string;
        };
        Returns: Json;
      };
      reserve_ai_call: {
        Args: { p_user_id: string; p_limit: number; p_since: string; p_daily_cap: number; p_premium: boolean; p_cap_since: string };
        Returns: Json;
      };
      release_ai_call: { Args: { p_reservation_id: string }; Returns: undefined };
      confirm_order: {
        Args: { p_order_id: string; p_bank_ref: string | null; p_paid_by: string; p_paid_amount: number | null };
        Returns: Json;
      };
      refund_order: { Args: { p_order_id: string }; Returns: Json };
      admin_funnel: { Args: { p_days: number }; Returns: Json };
      admin_list_orders: { Args: { p_limit: number }; Returns: (OrderRow & { email: string | null; name: string | null })[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
