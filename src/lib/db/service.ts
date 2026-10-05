import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '../env';
import type { Db } from './supabase';
import type { Database } from './types';

/**
 * Client service role: bỏ qua RLS. Chỉ dùng ở server cho việc người dùng không được tự làm
 * (ghi corrections, mục ôn own_error, đếm tổng lượt sửa toàn hệ thống). Không bao giờ tới trình duyệt.
 */
export function createServiceDb(serviceRoleKey: string): Db {
  return createClient<Database>(publicEnv().PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
