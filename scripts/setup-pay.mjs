// Bật thanh toán payOS (M5) trong một lệnh: npm run setup:pay
// Bạn dán 3 giá trị payOS cấp và email admin. Script đặt secret trên Cloudflare, ghi .dev.vars,
// tạo bảng mới trong database, deploy, rồi đăng ký địa chỉ webhook với payOS.
// Không in key ra màn hình. Chạy lại được nhiều lần.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const DEV_VARS = '.dev.vars';
const DEFAULT_SITE = 'https://epc-app.englishfordev.workers.dev';
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const step = (n, title) => console.log(`\n${bold(`Bước ${n}. ${title}`)}\n`);
const rl = createInterface({ input: stdin, output: stdout });

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
  console.log('Sửa xong thì chạy lại "npm run setup:pay". Giá trị đã dán được giữ, lần sau chỉ cần bấm Enter.');
  process.exit(1);
}

function run(title, cmd, args, env = {}) {
  console.log(`\n→ ${title}\n  $ ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) stop('Lệnh trên chưa chạy được. Đọc thông báo lỗi phía trên.');
}

function putSecret(name, value) {
  console.log(`\n→ Đặt secret ${name} trên Cloudflare`);
  const r = spawnSync('npx', ['wrangler', 'secret', 'put', name], { input: `${value}\n`, stdio: ['pipe', 'inherit', 'inherit'], shell: true });
  if (r.status !== 0) stop(`Chưa đặt được secret ${name}. Kiểm tra bạn đã đăng nhập Cloudflare bằng "npx wrangler login".`);
}

const vars = readVars(DEV_VARS);
const env = readVars('.env');
const site = (env.PUBLIC_SITE_URL || DEFAULT_SITE).replace(/\/$/, '');

async function ask(key, question, check) {
  for (;;) {
    const current = vars[key];
    const hint = current ? ' (Enter để giữ giá trị cũ)' : '';
    const value = (await rl.question(`   ${question}${hint}: `)).trim() || current || '';
    const problem = check(value);
    if (!problem) {
      vars[key] = value;
      return value;
    }
    console.log(`   ${problem}`);
  }
}

console.log(bold('\nBật thanh toán payOS cho English Personal Coach'));

// ---------- 1. payOS ----------
step(1, 'Tạo kênh thanh toán payOS');
console.log('   1. Mở https://my.payos.vn, đăng ký tài khoản cá nhân bằng CCCD.');
console.log('   2. Liên kết tài khoản ngân hàng MB của bạn (làm theo hướng dẫn trên trang payOS).');
console.log('   3. Vào "Kênh thanh toán", bấm "Tạo kênh thanh toán", đặt tên "EPC", chọn tài khoản MB vừa liên kết.');
console.log('   4. Mở kênh vừa tạo, chép 3 giá trị: Client ID, Api Key, Checksum Key.');
console.log(`   Ô "Webhook URL" để trống, lệnh này sẽ tự điền: ${bold(`${site}/api/payos/webhook`)}\n`);
const clientId = await ask('PAYOS_CLIENT_ID', 'Dán Client ID', (v) => (/^[A-Za-z0-9-]{8,}$/.test(v) ? '' : 'Client ID chưa đúng, chép lại nguyên giá trị.'));
const apiKey = await ask('PAYOS_API_KEY', 'Dán Api Key', (v) => (/^[A-Za-z0-9-]{8,}$/.test(v) ? '' : 'Api Key chưa đúng, chép lại nguyên giá trị.'));
const checksumKey = await ask('PAYOS_CHECKSUM_KEY', 'Dán Checksum Key', (v) =>
  /^[A-Za-z0-9]{16,}$/.test(v) ? '' : 'Checksum Key chưa đúng, chép lại nguyên giá trị.',
);

// ---------- 2. Admin ----------
step(2, 'Email admin');
console.log('   Email bạn dùng để đăng nhập EPC (Google hoặc GitHub). Chỉ email này vào được trang /admin.');
console.log('   Nhiều email thì cách nhau bằng dấu phẩy.');
const adminEmails = await ask('ADMIN_EMAILS', 'Email admin', (v) =>
  v.split(',').every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) ? '' : 'Email chưa đúng định dạng.',
);
rl.close();

const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
writeFileSync(DEV_VARS, ['# Secret cho npm run dev. Không commit file này.', ...lines, ''].join('\n'));

// ---------- 3. Database ----------
step(3, 'Thêm cột và hàm cho đơn hàng trong database');
run('Áp dụng migration mới', 'npx', ['supabase', 'db', 'push'], { SUPABASE_YES: 'true' });

// ---------- 4. Cloudflare ----------
step(4, 'Đặt secret trên Cloudflare');
putSecret('PAYOS_CLIENT_ID', clientId);
putSecret('PAYOS_API_KEY', apiKey);
putSecret('PAYOS_CHECKSUM_KEY', checksumKey);
putSecret('ADMIN_EMAILS', adminEmails);

// ---------- 5. Deploy ----------
step(5, 'Deploy');
run('Build và đưa lên Cloudflare', 'npm', ['run', 'deploy']);

// ---------- 6. Webhook ----------
step(6, 'Đăng ký webhook với payOS');
const webhookUrl = `${site}/api/payos/webhook`;
try {
  const res = await fetch('https://api-merchant.payos.vn/confirm-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-client-id': clientId, 'x-api-key': apiKey },
    body: JSON.stringify({ webhookUrl }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.code !== '00') {
    stop(`payOS chưa nhận webhook (mã ${body?.code ?? res.status}: ${body?.desc ?? ''}). Kiểm tra 3 giá trị payOS, rồi chạy lại.`);
  }
  console.log(`   Đã đăng ký ${bold(webhookUrl)} cho kênh ${body.data?.name ?? ''}.`);
} catch {
  stop('Không kết nối được payOS. Kiểm tra mạng rồi chạy lại.');
}

console.log(`\n${bold('Xong.')} Mở ${site}/nang-cap, chọn gói 30 ngày để thấy mã QR. Trang admin: ${site}/admin`);
