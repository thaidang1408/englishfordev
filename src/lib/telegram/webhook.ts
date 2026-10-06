import { z } from 'zod';
import { CATEGORY_NAMES, SENTENCE_MAX, SENTENCE_MIN } from '../ai/schema';
import type { CorrectData, CorrectOutcome } from '../correct/handler';
import { errors, ok } from '../http/response';
import { safeEqual } from '../pay/payos';
import type { Bot } from './bot';

export type TelegramRepo = {
  /** Gắn chat vào tài khoản có mã liên kết này, đổi mã mới. Trả về false khi mã không đúng. */
  linkChat(token: string, chatId: number): Promise<boolean>;
  /** Gỡ chat khỏi mọi tài khoản. Trả về true khi có tài khoản được gỡ. */
  unlinkChat(chatId: number): Promise<boolean>;
  /** Tài khoản EPC đang gắn với chat này, hoặc null. */
  userForChat(chatId: number): Promise<string | null>;
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
    'Đã liên kết Telegram với tài khoản EPC. Từ thứ Hai đến thứ Sáu, bot nhắc bạn trước giờ standup 30 đến 45 phút.\n\nGửi cho bot một câu tiếng Anh bạn sắp viết trên Slack, Jira hay email, bot sửa và giải thích bằng tiếng Việt, lỗi vào sổ lỗi của bạn. Cần hỗ trợ thì gõ /hotro kèm nội dung. Gõ /stop để tắt.',
  badToken: 'Link liên kết đã cũ hoặc không đúng. Mở lại nút "Liên kết Telegram" ở trang Tài khoản trên EPC.',
  welcome:
    'Đây là bot của English Personal Coach. Để nhận nhắc học và gửi câu tiếng Anh cho bot sửa, mở trang Tài khoản trên EPC và bấm "Liên kết Telegram". Cần hỗ trợ (thanh toán, hoàn tiền): chưa liên kết thì cứ nhắn vào đây, đã liên kết thì gõ /hotro kèm nội dung.',
  stopped: 'Đã tắt nhắc học và gỡ liên kết. Muốn bật lại, bấm "Liên kết Telegram" ở trang Tài khoản trên EPC.',
  notLinked: 'Chat này chưa liên kết với tài khoản EPC nào.',
  forwarded: 'Đã chuyển tin nhắn của bạn tới EPC. Bạn sẽ được trả lời qua Telegram.',
  hotroEmpty: 'Gõ /hotro kèm nội dung cần hỗ trợ, ví dụ: /hotro mình chuyển khoản sai nội dung.',
  length: `Bot sửa đoạn từ ${SENTENCE_MIN} đến ${SENTENCE_MAX.work} ký tự. Đoạn dài thì bạn gửi từng phần.`,
  unavailable: 'Tính năng sửa câu đang tạm tắt. Lượt sửa của bạn chưa bị trừ.',
  noAdmin: 'Lúc này chưa chuyển được tin nhắn. Bạn thử lại sau.',
  selfAdmin:
    'Chat này là chat admin: tin liên hệ của người dùng được chuyển về đây. Muốn thử /hotro, hãy nhắn từ một tài khoản Telegram khác.',
};

/** Tin trả lời sau khi sửa: văn bản thường, không parse_mode, nên câu của người dùng không thành định dạng. */
export function formatCorrection(data: CorrectData): string {
  const { result } = data;
  const lines: string[] = [];
  if (result.is_already_correct) lines.push('Câu này đã đúng, không cần sửa.', '', result.corrected);
  else lines.push('Bản sửa:', result.corrected);
  if (result.corrected_vi) lines.push('', `Nghĩa: ${result.corrected_vi}`);
  if (result.changes.length > 0) {
    lines.push('', 'Chỗ sửa:');
    result.changes.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.from || '(thiếu)'} → ${c.to || '(bỏ)'} (${CATEGORY_NAMES[c.category]}). ${c.why_vi}`);
    });
  }
  if (result.tip_vi) lines.push('', `Mẹo: ${result.tip_vi}`);
  lines.push('');
  if (data.review_items > 0) lines.push(`${data.review_items} chỗ sửa đã vào sổ lỗi, sẽ quay lại trong phần ôn.`);
  lines.push(
    data.period === 'day'
      ? `Hôm nay bạn còn ${data.remaining} lượt sửa.`
      : data.remaining > 0
        ? `Bạn còn ${data.remaining} lượt sửa trong 7 ngày này.`
        : 'Bạn đã dùng lượt sửa của 7 ngày này.',
  );
  return lines.join('\n');
}

/** POST /api/telegram/webhook (SPEC mục 9). */
export async function handleTelegramWebhook(input: {
  request: Request;
  secret: string | null;
  bot: Bot | null;
  /** null khi máy chủ chưa có service role key. */
  repo: TelegramRepo | null;
  /** Sửa một đoạn cho tài khoản này (cùng hạn mức với /api/correct). null khi máy chủ chưa có AI. */
  correctFor: ((userId: string, sentence: string) => Promise<CorrectOutcome>) | null;
}): Promise<Response> {
  const { request, secret, bot, repo, correctFor } = input;
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
  const hotro = /^\/hotro(?:@\w+)?(?:\s+([\s\S]*))?$/.exec(text);
  if (text.startsWith('/') && !hotro) {
    await bot.sendMessage(chatId, TEXT.welcome);
    return ok({ handled: true });
  }
  if (hotro && !hotro[1]?.trim()) {
    await bot.sendMessage(chatId, TEXT.hotroEmpty);
    return ok({ handled: true });
  }

  const userId = await repo.userForChat(chatId);
  // Chat đã liên kết gửi tin thường: sửa câu (SPEC mục 9 và 14). Không ghi nội dung vào log.
  if (userId && !hotro) {
    if (text.length < SENTENCE_MIN || text.length > SENTENCE_MAX.work) {
      await bot.sendMessage(chatId, TEXT.length);
      return ok({ handled: true });
    }
    if (!correctFor) {
      await bot.sendMessage(chatId, TEXT.unavailable);
      return ok({ handled: false });
    }
    const out = await correctFor(userId, text);
    const reply = out.ok
      ? formatCorrection(out.data)
      : out.code === 'free_quota_exceeded'
        ? `${out.message} Xem gói ở trang Nâng cấp trên EPC.`
        : out.message;
    await bot.sendMessage(chatId, reply);
    return ok({ handled: true });
  }

  // Chat chưa liên kết, hoặc /hotro: kênh liên hệ (thanh toán, hoàn tiền). Chuyển nguyên tin tới chat của admin.
  const allAdmins = await repo.adminChatIds();
  const admins = allAdmins.filter((id) => id !== chatId);
  if (admins.length === 0) {
    // Admin tự nhắn để thử: tin liên hệ vốn được chuyển về chính chat này, không cần chuyển.
    if (allAdmins.includes(chatId)) {
      await bot.sendMessage(chatId, TEXT.selfAdmin);
      return ok({ handled: true });
    }
    console.error('[telegram] chưa có tài khoản admin (ADMIN_EMAILS) nào liên kết Telegram, không chuyển được tin liên hệ');
    await bot.sendMessage(chatId, TEXT.noAdmin);
    return ok({ handled: false });
  }
  const linked = userId !== null;
  const who = [msg.from?.first_name, msg.from?.username ? `@${msg.from.username}` : undefined].filter(Boolean).join(' ');
  for (const admin of admins) {
    await bot.sendMessage(admin, `Tin nhắn liên hệ từ ${who || 'người dùng'} (chat ${chatId}, ${linked ? 'đã liên kết tài khoản' : 'chưa liên kết tài khoản'}):`);
    await bot.forwardMessage(admin, chatId, msg.message_id);
  }
  await bot.sendMessage(chatId, TEXT.forwarded);
  // 7. Phản hồi: luôn 200 sau khi xác thực, để Telegram không gửi lại.
  return ok({ handled: true });
}
