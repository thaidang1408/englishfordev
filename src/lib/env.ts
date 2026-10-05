import { z } from 'zod';
import { PUBLIC_SITE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/client';

const publicEnvSchema = z.object({
  PUBLIC_SUPABASE_URL: z.url(),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  PUBLIC_SITE_URL: z.url().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | undefined;

/** Đọc và kiểm biến môi trường một lần. Thiếu biến thì báo đúng tên biến (xem docs/SETUP.md). */
export function publicEnv(): PublicEnv {
  if (cached) return cached;
  const result = publicEnvSchema.safeParse({ PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SITE_URL });
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => String(i.path[0])))].join(', ');
    throw new Error(`Thiếu hoặc sai biến môi trường: ${names}. Xem docs/SETUP.md.`);
  }
  cached = result.data;
  return cached;
}
