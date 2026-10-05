import { z } from 'zod';

/**
 * Gọi Telegram Bot API (https://core.telegram.org/bots/api). Chỉ chạy ở server.
 * Tin nhắn gửi dạng văn bản thường (không parse_mode), nên nội dung người dùng không thành HTML.
 */
export type Bot = {
  sendMessage(chatId: number, text: string): Promise<boolean>;
  forwardMessage(chatId: number, fromChatId: number, messageId: number): Promise<boolean>;
};

const resultSchema = z.object({ ok: z.boolean(), description: z.string().optional() });

export const MAX_TEXT = 4096;

export function telegramBot(token: string, fetcher: typeof fetch = fetch): Bot {
  async function call(method: string, body: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetcher(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const parsed = resultSchema.safeParse(await res.json().catch(() => null));
      if (!parsed.success || !parsed.data.ok) {
        // Không ghi nội dung tin nhắn hay token vào log.
        console.error(`[telegram] ${method} lỗi ${res.status}: ${parsed.success ? (parsed.data.description ?? '') : 'phản hồi lạ'}`);
        return false;
      }
      return true;
    } catch {
      console.error(`[telegram] ${method} lỗi kết nối`);
      return false;
    }
  }
  return {
    sendMessage: (chatId, text) =>
      call('sendMessage', { chat_id: chatId, text: text.slice(0, MAX_TEXT), link_preview_options: { is_disabled: true } }),
    forwardMessage: (chatId, fromChatId, messageId) => call('forwardMessage', { chat_id: chatId, from_chat_id: fromChatId, message_id: messageId }),
  };
}

/** Link mở bot kèm mã liên kết (deep link /start). Mã chỉ gồm A-Z, a-z, 0-9, _ và -, tối đa 64 ký tự. */
export function startLink(botUsername: string, token: string): string {
  return `https://t.me/${encodeURIComponent(botUsername)}?start=${encodeURIComponent(token)}`;
}
