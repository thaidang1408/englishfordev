import { telegramRepo } from '../db/notify';
import { telegramBot } from '../telegram/bot';
import { vnDateKey } from '../time';

/**
 * Gửi cảnh báo ngắn (văn bản thường) tới chat Telegram của các admin đã liên kết. Không bao giờ ném lỗi.
 * Chỉ đưa vào text tên route, mã đơn, số tiền: không email, không câu của người dùng.
 */
export async function alertAdmins(text: string): Promise<void> {
  try {
    // Import động: env-server và service đọc astro:env, chỉ có khi chạy trong app.
    const [{ serverEnv }, { createServiceDb }] = await Promise.all([import('../env-server'), import('../db/service')]);
    const env = serverEnv();
    if (!env.TELEGRAM_BOT_TOKEN || !env.SUPABASE_SERVICE_ROLE_KEY) return;
    const ids = await telegramRepo(createServiceDb(env.SUPABASE_SERVICE_ROLE_KEY), env.ADMIN_EMAILS).adminChatIds();
    const bot = telegramBot(env.TELEGRAM_BOT_TOKEN);
    await Promise.all(ids.map((id) => bot.sendMessage(id, `[EPC cảnh báo] ${text}`)));
  } catch (e) {
    console.error('[alert] không gửi được cảnh báo:', e instanceof Error ? e.message : 'lỗi không rõ');
  }
}

// ponytail: chống trùng theo từng isolate, nhiều isolate thì có thể vài tin mỗi ngày; cần đúng một tin thì lưu ngày đã báo vào DB.
let capAlertDay = '';

/** Báo admin khi chạm trần AI_DAILY_CALL_CAP, tối đa một lần mỗi ngày (giờ Việt Nam, cùng mốc reset trần) trong một isolate. */
export function alertCapHit(now = new Date(), send: (text: string) => Promise<void> = alertAdmins): Promise<void> {
  const day = vnDateKey(now);
  if (day === capAlertDay) return Promise.resolve();
  capAlertDay = day;
  return send(`Đã chạm trần AI_DAILY_CALL_CAP ngày ${day}, người dùng đang bị chặn sửa câu tới hết ngày (giờ Việt Nam).`);
}
