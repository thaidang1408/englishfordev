import { z } from 'zod';
import { AI_DAILY_CALL_CAP, AI_MODEL, ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from 'astro:env/server';
import { DEFAULT_DAILY_CAP } from './correct/quota';

/**
 * Biến bí mật, chỉ import từ code server (endpoint, trang render theo request).
 * Đọc lúc chạy từ secret của Cloudflare, không nhúng vào bản build.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  ANTHROPIC_API_KEY: z.string().min(20).optional(),
  // Không đặt thì dùng model mặc định của nhà cung cấp (src/lib/ai/correct.ts).
  AI_MODEL: z.string().min(1).optional(),
  AI_DAILY_CALL_CAP: z.coerce.number().int().min(0).default(DEFAULT_DAILY_CAP),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function serverEnv(): ServerEnv {
  const blank = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: blank(SUPABASE_SERVICE_ROLE_KEY),
    ANTHROPIC_API_KEY: blank(ANTHROPIC_API_KEY),
    AI_MODEL: blank(AI_MODEL),
    AI_DAILY_CALL_CAP: blank(AI_DAILY_CALL_CAP),
  });
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => String(i.path[0])))].join(', ');
    throw new Error(`Sai biến môi trường: ${names}. Xem docs/SETUP.md.`);
  }
  return result.data;
}
