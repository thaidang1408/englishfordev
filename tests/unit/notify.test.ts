import { describe, expect, it } from 'vitest';
import type { Correction } from '../../src/lib/ai/schema';
import { lessons } from '../../src/lib/content/lessons';
import { reminderText, weeklyReportText } from '../../src/lib/notify/messages';
import { daysUntil, isReminderDay, isReportTime, reminderRanges, standupDay } from '../../src/lib/notify/schedule';
import { handleTick, type ReminderCandidate, type ReportCandidate, type TickRepo } from '../../src/lib/notify/tick';
import type { ErrorEntry } from '../../src/lib/stats/errors';
import type { Bot } from '../../src/lib/telegram/bot';
import { formatCorrection, handleTelegramWebhook, TEXT, type TelegramRepo } from '../../src/lib/telegram/webhook';
import type { CorrectData, CorrectOutcome } from '../../src/lib/correct/handler';

/** Giờ Việt Nam → UTC. */
const vn = (iso: string) => new Date(`${iso}+07:00`);
const SITE = 'https://epc.example';

describe('khung giờ nhắc', () => {
  it('nhắc người có giờ standup trong 30 đến 45 phút tới', () => {
    expect(reminderRanges(vn('2026-10-05T08:20:00'))).toEqual([{ from: '08:50:00', to: '09:05:00' }]);
  });

  it('qua nửa đêm thì tách hai khoảng', () => {
    expect(reminderRanges(vn('2026-10-05T23:20:00'))).toEqual([
      { from: '23:50:00', to: '24:00:00' },
      { from: '00:00:00', to: '00:05:00' },
    ]);
    expect(reminderRanges(vn('2026-10-05T23:40:00'))).toEqual([{ from: '00:10:00', to: '00:25:00' }]);
  });

  it('bốn lần cron trong một giờ phủ kín giờ đó, không chồng nhau', () => {
    const slots = ['08:00', '08:15', '08:30', '08:45'].map((t) => reminderRanges(vn(`2026-10-05T${t}:00`))[0]);
    expect(slots.map((r) => `${r?.from}-${r?.to}`)).toEqual(['08:30:00-08:45:00', '08:45:00-09:00:00', '09:00:00-09:15:00', '09:15:00-09:30:00']);
  });

  it('chỉ thứ Hai đến thứ Sáu, theo ngày của buổi standup', () => {
    expect(isReminderDay(vn('2026-10-09T08:20:00'))).toBe(true); // thứ Sáu
    expect(isReminderDay(vn('2026-10-10T08:20:00'))).toBe(false); // thứ Bảy
    expect(isReminderDay(vn('2026-10-04T23:40:00'))).toBe(true); // tối Chủ nhật, standup 00:10 thứ Hai
    expect(standupDay(vn('2026-10-04T23:40:00'))).toBe('2026-10-05');
  });

  it('báo cáo tuần: Chủ nhật trong giờ 20 theo giờ Việt Nam', () => {
    expect(isReportTime(vn('2026-10-11T20:00:00'))).toBe(true);
    expect(isReportTime(vn('2026-10-11T20:45:00'))).toBe(true);
    expect(isReportTime(vn('2026-10-11T21:00:00'))).toBe(false);
    expect(isReportTime(vn('2026-10-10T20:00:00'))).toBe(false);
  });

  it('đếm ngược phỏng vấn theo ngày Việt Nam, đã qua thì không hiện', () => {
    const now = vn('2026-10-05T23:30:00');
    expect(daysUntil('2026-10-05', now)).toBe(0);
    expect(daysUntil('2026-10-12', now)).toBe(7);
    expect(daysUntil('2026-10-04', now)).toBeNull();
  });
});

const correction = (changes: Correction['changes']): Correction => ({ is_already_correct: changes.length === 0, corrected: 'c', changes, tip_vi: '' });
const NOW = vn('2026-10-11T20:05:00');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const ENTRIES: ErrorEntry[] = [
  { created_at: daysAgo(1), original: 'I am waiting the review.', result: correction([{ from: 'waiting the', to: 'waiting for the', why_vi: 'x', category: 'preposition' }]) },
  { created_at: daysAgo(2), original: 'Discuss about it.', result: correction([{ from: 'about', to: '', why_vi: 'x', category: 'preposition' }]) },
  { created_at: daysAgo(3), original: 'Fix bug.', result: correction([{ from: 'bug', to: 'the bug', why_vi: 'x', category: 'article' }]) },
  { created_at: daysAgo(9), original: 'I have fixed yesterday.', result: correction([{ from: 'have fixed', to: 'fixed', why_vi: 'x', category: 'tense' }]) },
  { created_at: daysAgo(10), original: 'I am go.', result: correction([{ from: 'am go', to: 'go', why_vi: 'x', category: 'tense' }]) },
];

describe('nội dung tin', () => {
  it('tin nhắc có tên bài, công thức và link Hôm nay', () => {
    const text = reminderText(lessons[0]!, '09:00:00', SITE);
    expect(text).toContain('(09:00)');
    expect(text).toContain(lessons[0]!.title);
    expect(text).toContain(`${SITE}/hom-nay`);
    expect(text).not.toMatch(/!/);
  });

  it('báo cáo tuần: số câu, nhóm hay mắc kèm ví dụ thật, nhóm đã giảm, link ôn', () => {
    const text = weeklyReportText(ENTRIES, NOW, SITE) ?? '';
    expect(text).toContain('Tuần này bạn đã sửa 3 câu.');
    expect(text).toContain('Nhóm lỗi hay mắc nhất: giới từ (2 lần). Ví dụ của bạn: "waiting the" sửa thành "waiting for the".');
    expect(text).toContain('Nhóm lỗi đã giảm so với tuần trước: thì của động từ.');
    expect(text).toContain(`${SITE}/on-tap`);
    expect(text).not.toMatch(/!/);
  });

  it('tuần không có câu nào thì không gửi', () => {
    expect(weeklyReportText(ENTRIES.slice(3), NOW, SITE)).toBeNull();
  });
});

function fakeBot() {
  const sent: { chat: number; text: string }[] = [];
  const forwarded: { chat: number; from: number; id: number }[] = [];
  const bot: Bot = {
    sendMessage: async (chat, text) => (sent.push({ chat, text }), true),
    forwardMessage: async (chat, from, id) => (forwarded.push({ chat, from, id }), true),
  };
  return { bot, sent, forwarded };
}

const SECRET = 'cron-secret-for-tests-0123';

function fakeTickRepo(reminders: ReminderCandidate[], reports: ReportCandidate[] = []) {
  const claimed = { reminder: new Set<string>(), report: new Set<string>() };
  let pings = 0;
  const trialWindows: [Date, Date][] = [];
  const repo: TickRepo = {
    logTrialEnds: async (from, to) => void trialWindows.push([from, to]),
    ping: async () => void pings++,
    reminderCandidates: async () => reminders,
    claimReminder: async (id, day) => (claimed.reminder.has(`${id}:${day}`) ? false : (claimed.reminder.add(`${id}:${day}`), true)),
    reportCandidates: async () => reports,
    claimReport: async (id, day) => (claimed.report.has(`${id}:${day}`) ? false : (claimed.report.add(`${id}:${day}`), true)),
  };
  return { repo, pings: () => pings, trialWindows };
}

const tick = (opts: { repo: TickRepo; bot?: Bot | null; now: Date; auth?: string; query?: string; method?: string }) =>
  handleTick({
    request: new Request(`${SITE}/api/cron/tick${opts.query ?? ''}`, {
      method: opts.method ?? 'POST',
      headers: { Authorization: opts.auth ?? `Bearer ${SECRET}` },
    }),
    secret: SECRET,
    bot: opts.bot === undefined ? fakeBot().bot : opts.bot,
    repo: opts.repo,
    lessons,
    now: opts.now,
    site: SITE,
  });

const candidate = (over: Partial<ReminderCandidate> = {}): ReminderCandidate => ({
  user_id: 'u1',
  chat_id: 101,
  track: 'standup',
  standup_time: '09:00:00',
  done: [],
  learned_today: false,
  ...over,
});

describe('POST /api/cron/tick', () => {
  const MONDAY_0820 = vn('2026-10-05T08:20:00');

  it('chỉ nhận POST đúng CRON_SECRET', async () => {
    const { repo, pings } = fakeTickRepo([]);
    expect((await tick({ repo, now: MONDAY_0820, method: 'GET' })).status).toBe(405);
    expect((await tick({ repo, now: MONDAY_0820, auth: 'Bearer sai' })).status).toBe(401);
    expect((await tick({ repo, now: MONDAY_0820, auth: '' })).status).toBe(401);
    expect((await tick({ repo, now: MONDAY_0820, query: '?task=xoa' })).status).toBe(400);
    expect(pings()).toBe(0);
  });

  it('ghi trial_end cho khung 15 phút vừa qua, khung liền nhau không chồng lên nhau', async () => {
    const { repo, trialWindows } = fakeTickRepo([]);
    await tick({ repo, now: vn('2026-10-05T08:15:07') });
    await tick({ repo, now: vn('2026-10-05T08:30:02') });
    await tick({ repo, now: MONDAY_0820, query: '?task=report' });
    expect(trialWindows).toEqual([
      [vn('2026-10-05T08:00:00'), vn('2026-10-05T08:15:00')],
      [vn('2026-10-05T08:15:00'), vn('2026-10-05T08:30:00')],
    ]);
  });

  it('mỗi lần chạy có một truy vấn giữ Supabase không tạm dừng', async () => {
    const { repo, pings } = fakeTickRepo([]);
    await tick({ repo, now: vn('2026-10-10T08:20:00') });
    expect(pings()).toBe(1);
  });

  it('nhắc người chưa học hôm nay, đúng bài của ngày; người đã học thì không', async () => {
    const { repo } = fakeTickRepo([candidate(), candidate({ user_id: 'u2', chat_id: 102, learned_today: true })]);
    const { bot, sent } = fakeBot();
    const res = await tick({ repo, bot, now: MONDAY_0820 });
    expect(await res.json()).toMatchObject({ data: { reminders: 1 } });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.chat).toBe(101);
    expect(sent[0]?.text).toContain(lessons[0]!.title);
  });

  it('cron chạy lại trong cùng ngày: không gửi tin thứ hai', async () => {
    const { repo } = fakeTickRepo([candidate()]);
    const { bot, sent } = fakeBot();
    await tick({ repo, bot, now: MONDAY_0820 });
    await tick({ repo, bot, now: MONDAY_0820 });
    expect(sent).toHaveLength(1);
  });

  it('cuối tuần không nhắc', async () => {
    const { repo } = fakeTickRepo([candidate()]);
    const { bot, sent } = fakeBot();
    await tick({ repo, bot, now: vn('2026-10-10T08:20:00') });
    expect(sent).toHaveLength(0);
  });

  it('học hết track thì không nhắc', async () => {
    const all = lessons.filter((l) => l.track === 'standup').map((l) => `standup-${String(l.id).padStart(2, '0')}`);
    const { repo } = fakeTickRepo([candidate({ done: all })]);
    const { bot, sent } = fakeBot();
    await tick({ repo, bot, now: MONDAY_0820 });
    expect(sent).toHaveLength(0);
  });

  it('gọi tay báo cáo tuần: tài khoản có câu đã sửa nhận đúng một tin, gọi lại không gửi thêm', async () => {
    const { repo } = fakeTickRepo([], [
      { user_id: 'p1', chat_id: 201, entries: ENTRIES },
      { user_id: 'p2', chat_id: 202, entries: ENTRIES.slice(3) },
    ]);
    const { bot, sent } = fakeBot();
    const now = vn('2026-10-11T10:00:00'); // sáng Chủ nhật, ngoài giờ báo cáo
    await tick({ repo, bot, now, query: '?task=report' });
    await tick({ repo, bot, now, query: '?task=report' });
    expect(sent.map((s) => s.chat)).toEqual([201]);
    expect(sent[0]?.text).toContain('Tuần này bạn đã sửa');
  });

  it('ngoài giờ báo cáo, cron thường không gửi báo cáo', async () => {
    const { repo } = fakeTickRepo([], [{ user_id: 'p1', chat_id: 201, entries: ENTRIES }]);
    const { bot, sent } = fakeBot();
    await tick({ repo, bot, now: vn('2026-10-11T19:45:00') });
    expect(sent).toHaveLength(0);
    await tick({ repo, bot, now: vn('2026-10-11T20:00:00') });
    expect(sent.map((s) => s.chat)).toEqual([201]);
  });

  it('chưa có bot: vẫn giữ Supabase hoạt động, không gửi gì', async () => {
    const { repo, pings } = fakeTickRepo([candidate()]);
    const body = await (await tick({ repo, bot: null, now: MONDAY_0820 })).json();
    expect(body).toMatchObject({ data: { bot: false } });
    expect(pings()).toBe(1);
  });
});

// ---------- webhook Telegram ----------

const WEBHOOK_SECRET = 'telegram-secret-0123456789';

function fakeTelegramRepo(admins: number[] = [900]) {
  const links = new Map<number, string>();
  const repo: TelegramRepo = {
    linkChat: async (token, chat) => (token === 'tok_ok' ? (links.set(chat, 'user-a'), true) : false),
    unlinkChat: async (chat) => links.delete(chat),
    userForChat: async (chat) => links.get(chat) ?? null,
    adminChatIds: async () => admins,
  };
  return { repo, links };
}

const update = (text: string, chat: { id: number; type: string } = { id: 55, type: 'private' }) => ({
  update_id: 1,
  message: { message_id: 7, chat, from: { id: chat.id, first_name: 'An', username: 'an_dev' }, text },
});

const CORRECTED: CorrectData = {
  id: 'c1',
  original: 'I have fixed bug yesterday.',
  result: {
    is_already_correct: false,
    corrected: 'I fixed the bug yesterday.',
    corrected_vi: 'Hôm qua mình đã sửa bug.',
    changes: [{ from: 'have fixed', to: 'fixed', why_vi: 'Có yesterday thì dùng quá khứ đơn.', category: 'tense' }],
    tip_vi: '',
  },
  remaining: 9,
  period: 'day',
  review_items: 1,
};

type Hook = { repo: TelegramRepo; bot: Bot; header?: string | null; correctFor?: (u: string, t: string) => Promise<CorrectOutcome> };

const hook = (body: unknown, opts: Hook) =>
  handleTelegramWebhook({
    request: new Request(`${SITE}/api/telegram/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.header === null ? {} : { 'X-Telegram-Bot-Api-Secret-Token': opts.header ?? WEBHOOK_SECRET }),
      },
      body: JSON.stringify(body),
    }),
    secret: WEBHOOK_SECRET,
    bot: opts.bot,
    repo: opts.repo,
    correctFor: opts.correctFor ?? null,
  });

describe('POST /api/telegram/webhook', () => {
  it('thiếu hoặc sai secret token: 401, không làm gì', async () => {
    const { repo, links } = fakeTelegramRepo();
    const { bot, sent } = fakeBot();
    expect((await hook(update('/start tok_ok'), { repo, bot, header: null })).status).toBe(401);
    expect((await hook(update('/start tok_ok'), { repo, bot, header: 'sai' })).status).toBe(401);
    expect(links.size).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it('/start <mã> liên kết chat với tài khoản', async () => {
    const { repo, links } = fakeTelegramRepo();
    const { bot, sent } = fakeBot();
    expect((await hook(update('/start tok_ok'), { repo, bot })).status).toBe(200);
    expect(links.get(55)).toBe('user-a');
    expect(sent).toEqual([{ chat: 55, text: TEXT.linked }]);
  });

  it('mã sai hoặc không có mã: không liên kết, hướng dẫn mở lại từ trang Tài khoản', async () => {
    const { repo, links } = fakeTelegramRepo();
    const { bot, sent } = fakeBot();
    await hook(update('/start tok_sai'), { repo, bot });
    await hook(update('/start'), { repo, bot });
    expect(links.size).toBe(0);
    expect(sent.map((s) => s.text)).toEqual([TEXT.badToken, TEXT.welcome]);
  });

  it('/stop gỡ liên kết', async () => {
    const { repo, links } = fakeTelegramRepo();
    const { bot, sent } = fakeBot();
    await hook(update('/start tok_ok'), { repo, bot });
    await hook(update('/stop'), { repo, bot });
    expect(links.size).toBe(0);
    expect(sent.at(-1)?.text).toBe(TEXT.stopped);
  });

  it('tin nhắn thường được chuyển tới admin làm kênh liên hệ', async () => {
    const { repo } = fakeTelegramRepo([900]);
    const { bot, sent, forwarded } = fakeBot();
    await hook(update('Mình chuyển sai nội dung, mã EPCABCDE'), { repo, bot });
    expect(forwarded).toEqual([{ chat: 900, from: 55, id: 7 }]);
    expect(sent[0]?.chat).toBe(900);
    expect(sent[0]?.text).toContain('An @an_dev');
    expect(sent.at(-1)).toEqual({ chat: 55, text: TEXT.forwarded });
  });

  it('chat đã liên kết gửi câu tiếng Anh: bot sửa cho đúng tài khoản và trả bản sửa có nghĩa tiếng Việt', async () => {
    const { repo } = fakeTelegramRepo();
    const { bot, sent, forwarded } = fakeBot();
    const calls: [string, string][] = [];
    const correctFor = async (u: string, t: string): Promise<CorrectOutcome> => (calls.push([u, t]), { ok: true, data: CORRECTED });
    await hook(update('/start tok_ok'), { repo, bot });
    await hook(update('  I have fixed bug yesterday.  '), { repo, bot, correctFor });
    expect(calls).toEqual([['user-a', 'I have fixed bug yesterday.']]);
    expect(forwarded).toHaveLength(0);
    const reply = sent.at(-1)!;
    expect(reply.chat).toBe(55);
    expect(reply.text).toBe(formatCorrection(CORRECTED));
    expect(reply.text).toContain('I fixed the bug yesterday.');
    expect(reply.text).toContain('Nghĩa: Hôm qua mình đã sửa bug.');
    expect(reply.text).toContain('have fixed → fixed (thì của động từ)');
    expect(reply.text).toContain('Hôm nay bạn còn 9 lượt sửa.');
  });

  it('đoạn quá ngắn hoặc quá dài: không gọi AI', async () => {
    const { repo } = fakeTelegramRepo();
    const { bot, sent } = fakeBot();
    let calls = 0;
    const correctFor = async (): Promise<CorrectOutcome> => (calls++, { ok: true, data: CORRECTED });
    await hook(update('/start tok_ok'), { repo, bot });
    await hook(update('ok'), { repo, bot, correctFor });
    await hook(update('a'.repeat(301)), { repo, bot, correctFor });
    expect(calls).toBe(0);
    expect(sent.slice(-2).map((m) => m.text)).toEqual([TEXT.length, TEXT.length]);
  });

  it('hết lượt: trả đúng thông báo hạn mức', async () => {
    const { repo } = fakeTelegramRepo();
    const { bot, sent } = fakeBot();
    const correctFor = async (): Promise<CorrectOutcome> => ({ ok: false, status: 429, code: 'quota_exceeded', message: 'Hết lượt hôm nay.' });
    await hook(update('/start tok_ok'), { repo, bot });
    await hook(update('I fixed the bug.'), { repo, bot, correctFor });
    expect(sent.at(-1)?.text).toBe('Hết lượt hôm nay.');
  });

  it('chat đã liên kết dùng /hotro để liên hệ admin; /hotro trống thì được hướng dẫn', async () => {
    const { repo } = fakeTelegramRepo([900]);
    const { bot, sent, forwarded } = fakeBot();
    let calls = 0;
    const correctFor = async (): Promise<CorrectOutcome> => (calls++, { ok: true, data: CORRECTED });
    await hook(update('/start tok_ok'), { repo, bot });
    await hook(update('/hotro'), { repo, bot, correctFor });
    expect(sent.at(-1)?.text).toBe(TEXT.hotroEmpty);
    await hook(update('/hotro mình chuyển sai nội dung'), { repo, bot, correctFor });
    expect(calls).toBe(0);
    expect(forwarded).toEqual([{ chat: 900, from: 55, id: 7 }]);
    expect(sent.find((m) => m.chat === 900)?.text).toContain('đã liên kết tài khoản');
    expect(sent.at(-1)).toEqual({ chat: 55, text: TEXT.forwarded });
  });

  it('nhóm chat và update không phải tin nhắn: bỏ qua', async () => {
    const { repo, links } = fakeTelegramRepo();
    const { bot, sent } = fakeBot();
    expect((await hook(update('/start tok_ok', { id: -5, type: 'group' }), { repo, bot })).status).toBe(200);
    expect((await hook({ update_id: 2, edited_message: {} }, { repo, bot })).status).toBe(200);
    expect(links.size).toBe(0);
    expect(sent).toHaveLength(0);
  });
});
