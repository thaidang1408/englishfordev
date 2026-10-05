// Bật bot Telegram và nhắc học (M6) trong một lệnh: npm run setup:bot
// Bạn chỉ dán token BotFather cấp. Script tự lấy tên bot, tạo hai secret ngẫu nhiên,
// đặt secret trên Cloudflare, tạo cột mới trong database, deploy app và worker cron, đăng ký webhook.
// Không in token ra màn hình. Chạy lại được nhiều lần.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const DEV_VARS = '.dev.vars';
const DEFAULT_SITE = 'https://epc-app.englishfordev.workers.dev';
const CRON_CONFIG = 'cron/wrangler.jsonc';
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const step = (n, title) => console.log(`\n${bold(`Bước ${n}. ${title}`)}\n`);

function readVars(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function stop(message) {
  console.log(`\n${bold('Dừng ở đây.')} ${message}`);
  console.log('Sửa xong thì chạy lại "npm run setup:bot". Token đã dán được giữ, lần sau chỉ cần bấm Enter.');
  process.exit(1);
}

function run(title, cmd, args, env = {}) {
  console.log(`\n→ ${title}\n  $ ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) stop('Lệnh trên chưa chạy được. Đọc thông báo lỗi phía trên.');
}

function putSecret(name, value, extra = []) {
  console.log(`\n→ Đặt secret ${name}${extra.length ? ' cho worker cron' : ''} trên Cloudflare`);
  const r = spawnSync('npx', ['wrangler', 'secret', 'put', name, ...extra], {
    input: `${value}\n`,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });
  if (r.status !== 0) stop(`Chưa đặt được secret ${name}. Kiểm tra bạn đã đăng nhập Cloudflare bằng "npx wrangler login".`);
}

async function telegram(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return res.json().catch(() => ({ ok: false }));
}

const vars = readVars(DEV_VARS);
const site = (readVars('.env').PUBLIC_SITE_URL || DEFAULT_SITE).replace(/\/$/, '');

console.log(bold('\nBật bot Telegram cho English Personal Coach'));
if (!vars.SUPABASE_SERVICE_ROLE_KEY) stop('Chưa có secret key Supabase trên máy này. Chạy "npm run setup:ai" trước.');

// ---------- 1. BotFather ----------
step(1, 'Tạo bot với BotFather');
console.log('   1. Mở Telegram, tìm @BotFather (có dấu tích xanh), bấm Start.');
console.log('   2. Gõ /newbot. Đặt tên hiển thị, ví dụ: English Personal Coach.');
console.log('   3. Đặt username, phải kết thúc bằng "bot", ví dụ: epc_coach_bot.');
console.log('   4. BotFather gửi một token dạng 123456789:AA... Chép token đó.\n');
const rl = createInterface({ input: stdin, output: stdout });
let token = '';
let username = '';
for (;;) {
  const hint = vars.TELEGRAM_BOT_TOKEN ? ' (Enter để giữ token cũ)' : '';
  token = (await rl.question(`   Dán token bot${hint}: `)).trim() || vars.TELEGRAM_BOT_TOKEN || '';
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) {
    console.log('   Token phải có dạng số:chuỗi ký tự. Chép lại nguyên token BotFather gửi.');
    continue;
  }
  const me = await telegram(token, 'getMe').catch(() => ({ ok: false }));
  if (me.ok && me.result?.username) {
    username = me.result.username;
    break;
  }
  console.log('   Telegram không nhận token này. Kiểm tra lại, hoặc tạo token mới bằng /token trong BotFather.');
}
rl.close();
console.log(`   Bot của bạn: ${bold(`@${username}`)}`);

vars.TELEGRAM_BOT_TOKEN = token;
vars.TELEGRAM_BOT_USERNAME = username;
vars.TELEGRAM_WEBHOOK_SECRET ||= randomBytes(24).toString('hex');
vars.CRON_SECRET ||= randomBytes(24).toString('hex');
writeFileSync(DEV_VARS, ['# Secret cho npm run dev. Không commit file này.', ...Object.entries(vars).map(([k, v]) => `${k}=${v}`), ''].join('\n'));

// ---------- 2. Database ----------
step(2, 'Thêm cột ngày đã nhắc trong database');
run('Áp dụng migration mới', 'npx', ['supabase', 'db', 'push'], { SUPABASE_YES: 'true' });

// ---------- 3. Secret và deploy app ----------
step(3, 'Đặt secret và deploy app');
putSecret('TELEGRAM_BOT_TOKEN', token);
putSecret('TELEGRAM_BOT_USERNAME', username);
putSecret('TELEGRAM_WEBHOOK_SECRET', vars.TELEGRAM_WEBHOOK_SECRET);
putSecret('CRON_SECRET', vars.CRON_SECRET);
run('Build và đưa app lên Cloudflare', 'npm', ['run', 'deploy']);

// ---------- 4. Worker cron ----------
step(4, 'Deploy worker cron (chạy mỗi 15 phút)');
run('Đưa worker cron lên Cloudflare', 'npx', ['wrangler', 'deploy', '--config', CRON_CONFIG]);
putSecret('CRON_SECRET', vars.CRON_SECRET, ['--config', CRON_CONFIG]);

// ---------- 5. Webhook ----------
step(5, 'Đăng ký webhook với Telegram');
const hook = await telegram(token, 'setWebhook', {
  url: `${site}/api/telegram/webhook`,
  secret_token: vars.TELEGRAM_WEBHOOK_SECRET,
  allowed_updates: ['message'],
  drop_pending_updates: true,
});
if (!hook.ok) stop(`Telegram chưa nhận webhook: ${hook.description ?? 'không rõ lý do'}.`);
console.log(`   Đã đăng ký ${bold(`${site}/api/telegram/webhook`)}.`);

console.log(`\n${bold('Xong.')} Việc cuối cùng:`);
console.log(`   1. Mở ${site}/tai-khoan, bấm "Liên kết Telegram", rồi bấm Start trong Telegram.`);
console.log('      Bạn là admin nên tin nhắn liên hệ của người dùng cũng sẽ được chuyển tới chat này.');
console.log('   2. Thử nhắc: ở /tai-khoan đặt giờ standup sau giờ hiện tại khoảng 40 phút (thứ Hai đến thứ Sáu).');
