import { z } from 'zod';
import { errors, ok } from '../http/response';
import { safeEqual } from '../pay/payos';
import type { Bot } from './bot';

export type TelegramRepo = {
  /** Gắn chat vào tài khoản có mã liên kết này, đổi mã mới. Trả về false khi mã không đúng. */
  linkChat(token: string, chatId: number): Promise<boolean>;
  /** Gỡ chat khỏi mọi tài khoản. Trả về true khi có tài khoản được gỡ. */
  unlinkChat(chatId: number): Promise<boolean>;
  isLinked(chatId: number): Promise<boolean>;
  /** Chat Telegram của các admin (ADMIN_EMAILS) đã liên kết, để chuyển tin nhắn liên hệ. */
  adminChatIds(): Promise<number[]>;
};

const updateSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      message_id: z.number(),
      chat: z.object({ id: z.number(), type: z.string() }),
      from: z.object({ id: z.number(), first_name: z.string().max(200).optional(), username: z.string().max(64).optional() }).optional(),
      text: z.string().max(4096).optional(),
    })
    .optional(),
});

export const TEXT = {
  linked:
    'Đã liên kết Telegram với tài khoản EPC. Từ thứ Hai đến thứ Sáu, bot nhắc bạn trước giờ standup 30 đến 45 phút. Gõ /stop để tắt.',
  badToken: 'Link liên kết đã cũ hoặc không đúng. Mở lại nút "Liên kết Telegram" ở trang Tài khoản trên EPC.',
  welcome:
    'Đây là bot của English Personal Coach. Để nhận nhắc học, mở trang Tài khoản trên EPC và bấm "Liên kết Telegram". Cần hỗ trợ (thanh toán, hoàn tiền), cứ nhắn vào đây.',
  stopped: 'Đã tắt nhắc học và gỡ liên kết. Muốn bật lại, bấm "Liên kết Telegram" ở trang Tài khoản trên EPC.',
  notLinked: 'Chat này chưa liên kết với tài khoản EPC nào.',
  forwarded: 'Đã chuyển tin nhắn của bạn tới EPC. Bạn sẽ được trả lời qua Telegram.',
  noAdmin: 'Lúc này chưa chuyển được tin nhắn. Bạn thử lại sau.',
};

/** POST /api/telegram/webhook (SPEC mục 9). */
export async function handleTelegramWebhook(input: {
  request: Request;
  secret: string | null;
  bot: Bot | null;
  /** null khi máy chủ chưa có service role key. */
  repo: TelegramRepo | null;
}): Promise<Response> {
  const { request, secret, bot, repo } = input;
  // 1. Phương thức
  if (request.method !== 'POST') return errors.method();
  // 2. Nguồn gốc: secret token Telegram gửi trong header, so sánh thời gian hằng. Sai thì 401, không làm gì.
  const header = request.headers.get('X-Telegram-Bot-Api-Secret-Token') ?? '';
  if (!secret || !bot || !safeEqual(header, secret)) return errors.unauthenticated();
  if (!repo) return errors.internal();

  // 4. Dữ liệu vào. Update lạ hoặc không phải tin nhắn văn bản trong chat riêng: báo đã nhận, không làm gì.
  const body = updateSchema.safeParse(await request.json().catch(() => null));
  const msg = body.success ? body.data.message : undefined;
  if (!msg || msg.chat.type !== 'private' || !msg.text) return ok({ handled: false });
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // 3 và 6. Danh tính là chat Telegram; tài khoản EPC chỉ được gắn qua mã liên kết bí mật.
  const start = /^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?$/.exec(text);
  if (start) {
    const token = start[1];
    if (!token) await bot.sendMessage(chatId, TEXT.welcome);
    else await bot.sendMessage(chatId, (await repo.linkChat(token, chatId)) ? TEXT.linked : TEXT.badToken);
    return ok({ handled: true });
  }
  if (/^\/stop(?:@\w+)?$/.test(text)) {
    await bot.sendMessage(chatId, (await repo.unlinkChat(chatId)) ? TEXT.stopped : TEXT.notLinked);
    return ok({ handled: true });
  }
  if (text.startsWith('/')) {
    await bot.sendMessage(chatId, TEXT.welcome);
    return ok({ handled: true });
  }

  // Tin nhắn thường: kênh liên hệ (thanh toán, hoàn tiền). Chuyển nguyên tin tới chat của admin.
  const admins = (await repo.adminChatIds()).filter((id) => id !== chatId);
  if (admins.length === 0) {
    await bot.sendMessage(chatId, TEXT.noAdmin);
    return ok({ handled: false });
  }
  const linked = await repo.isLinked(chatId);
  const who = [msg.from?.first_name, msg.from?.username ? `@${msg.from.username}` : undefined].filter(Boolean).join(' ');
  for (const admin of admins) {
    await bot.sendMessage(admin, `Tin nhắn liên hệ từ ${who || 'người dùng'} (chat ${chatId}, ${linked ? 'đã liên kết tài khoản' : 'chưa liên kết tài khoản'}):`);
    await bot.forwardMessage(admin, chatId, msg.message_id);
  }
  await bot.sendMessage(chatId, TEXT.forwarded);
  // 7. Phản hồi: luôn 200 sau khi xác thực, để Telegram không gửi lại.
  return ok({ handled: true });
}
