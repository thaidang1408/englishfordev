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
};
export type ProfileUpdate = Partial<
  Pick<ProfileRow, 'display_name' | 'level' | 'weak_area' | 'track' | 'standup_time' | 'interview_date'>
>;

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

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, never, ProfileUpdate>;
      entitlements: Table<EntitlementRow, never, never>;
      lesson_progress: Table<LessonProgressRow, Omit<LessonProgressRow, 'completed_at'> & { completed_at?: string }>;
      review_items: Table<ReviewItemRow, ReviewItemInsert, Partial<Pick<ReviewItemRow, 'box' | 'due_at'>>>;
      corrections: Table<CorrectionRow, never, never>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
