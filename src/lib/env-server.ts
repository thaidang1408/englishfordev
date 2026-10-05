import { z } from 'zod';
import {
  ADMIN_EMAILS,
  AI_DAILY_CALL_CAP,
  AI_MODEL,
  ANTHROPIC_API_KEY,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  PAYOS_CLIENT_ID,
  SUPABASE_SERVICE_ROLE_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_WEBHOOK_SECRET,
  CRON_SECRET,
} from 'astro:env/server';
import { DEFAULT_DAILY_CAP } from './correct/quota';
import type { PayosConfig } from './pay/payos';

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
  // Email admin, cách nhau bằng dấu phẩy. Không đặt thì không ai vào được /admin.
  ADMIN_EMAILS: z
    .string()
    .optional()
    .transform((v) => (v ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)),
  PAYOS_CLIENT_ID: z.string().min(8).optional(),
  PAYOS_API_KEY: z.string().min(8).optional(),
  PAYOS_CHECKSUM_KEY: z.string().min(16).optional(),
  TELEGRAM_BOT_TOKEN: z.string().regex(/^\d+:[A-Za-z0-9_-]{30,}$/).optional(),
  TELEGRAM_BOT_USERNAME: z.string().regex(/^[A-Za-z0-9_]{5,32}$/).optional(),
  // Secret token của webhook Telegram: chỉ A-Z, a-z, 0-9, _ và -.
  TELEGRAM_WEBHOOK_SECRET: z.string().regex(/^[A-Za-z0-9_-]{16,256}$/).optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Cấu hình payOS, hoặc null khi chưa chạy npm run setup:pay. */
export function payosConfig(env: ServerEnv): PayosConfig | null {
  if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) return null;
  return { clientId: env.PAYOS_CLIENT_ID, apiKey: env.PAYOS_API_KEY, checksumKey: env.PAYOS_CHECKSUM_KEY };
}

export function serverEnv(): ServerEnv {
  const blank = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: blank(SUPABASE_SERVICE_ROLE_KEY),
    ANTHROPIC_API_KEY: blank(ANTHROPIC_API_KEY),
    AI_MODEL: blank(AI_MODEL),
    AI_DAILY_CALL_CAP: blank(AI_DAILY_CALL_CAP),
    ADMIN_EMAILS: blank(ADMIN_EMAILS),
    PAYOS_CLIENT_ID: blank(PAYOS_CLIENT_ID),
    PAYOS_API_KEY: blank(PAYOS_API_KEY),
    PAYOS_CHECKSUM_KEY: blank(PAYOS_CHECKSUM_KEY),
    TELEGRAM_BOT_TOKEN: blank(TELEGRAM_BOT_TOKEN),
    TELEGRAM_BOT_USERNAME: blank(TELEGRAM_BOT_USERNAME),
    TELEGRAM_WEBHOOK_SECRET: blank(TELEGRAM_WEBHOOK_SECRET),
    CRON_SECRET: blank(CRON_SECRET),
  });
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => String(i.path[0])))].join(', ');
    throw new Error(`Sai biến môi trường: ${names}. Xem docs/SETUP.md.`);
  }
  return result.data;
}
