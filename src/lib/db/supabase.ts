import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { publicEnv } from '../env';
import type { Database } from './types';

export type Db = SupabaseClient<Database>;

/**
 * Client Supabase cho một request, dùng anon key và session của người dùng nên RLS luôn áp dụng.
 * Không có client ở trình duyệt: cookie session đặt HttpOnly (skill security).
 * `resHeaders` nhận các header chống cache mà @supabase/ssr trả về khi ghi cookie.
 */
export function createSupabase(request: Request, cookies: AstroCookies, resHeaders?: Headers): Db {
  const env = publicEnv();
  const secure = new URL(request.url).protocol === 'https:';
  return createServerClient<Database>(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () =>
        parseCookieHeader(request.headers.get('Cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' })),
      setAll(toSet, headers) {
        for (const { name, value, options } of toSet) {
          cookies.set(name, value, { ...options, httpOnly: true, secure, sameSite: 'lax', path: '/' });
        }
        if (resHeaders) for (const [k, v] of Object.entries(headers)) resHeaders.set(k, v);
      },
    },
  });
}
