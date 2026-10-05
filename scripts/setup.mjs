// Cài đặt Supabase và đăng nhập cho EPC trong một lệnh: npm run setup
// Hỏi từng giá trị cần dán, ghi vào .env, rồi tự chạy: đăng nhập CLI, kết nối project,
// tạo bảng, cấu hình đăng nhập Google và GitHub, deploy. Chạy lại được nhiều lần.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const SITE = 'https://epc-app.englishfordev.workers.dev';
const ENV_FILE = '.env'; // biến PUBLIC_ cho bản build
const SECRET_FILE = '.env.setup'; // client secret OAuth, chỉ dùng khi đẩy cấu hình lên Supabase
const rl = createInterface({ input: stdin, output: stdout });

const env = { ...readEnv(ENV_FILE), ...readEnv(SECRET_FILE) };

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const step = (n, title) => console.log(`\n${bold(`Bước ${n}. ${title}`)}\n`);
const copy = (label, value) => console.log(`   ${label}:\n     ${bold(value)}`);

function readEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function saveEnv() {
  const pub = [
    '# Tạo bởi npm run setup. Không commit file này.',
    `PUBLIC_SUPABASE_URL=${env.PUBLIC_SUPABASE_URL ?? ''}`,
    `PUBLIC_SUPABASE_ANON_KEY=${env.PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
    `PUBLIC_SITE_URL=${env.PUBLIC_SITE_URL ?? SITE}`,
    '',
  ];
  const secret = [
    '# Tạo bởi npm run setup. Client secret OAuth, không commit, không đưa vào bản build.',
    ...['GITHUB_CLIENT_ID', 'GITHUB_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_SECRET'].map(
      (k) => `SUPABASE_AUTH_EXTERNAL_${k}=${env[`SUPABASE_AUTH_EXTERNAL_${k}`] ?? ''}`,
    ),
    '',
  ];
  writeFileSync(ENV_FILE, pub.join('\n'));
  writeFileSync(SECRET_FILE, secret.join('\n'));
}

/** Hỏi một giá trị. Đã nhập ở lần chạy trước thì bấm Enter để giữ. */
async function ask(key, question, check) {
  for (;;) {
    const current = env[key];
    const hint = current ? ` (Enter để giữ ${current.slice(0, 12)}...)` : '';
    const answer = (await rl.question(`   ${question}${hint}: `)).trim();
    const value = answer || current || '';
    const problem = check(value);
    if (!problem) {
      env[key] = value;
      saveEnv();
      return value;
    }
    console.log(`   ${problem}`);
  }
}

function run(title, cmd, args, extraEnv = {}) {
  console.log(`\n→ ${title}\n  $ ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: { ...process.env, ...env, ...extraEnv } });
  if (r.status !== 0) {
    console.log(`\n${bold('Dừng ở đây.')} Lệnh trên chưa chạy được. Đọc thông báo lỗi phía trên, sửa rồi chạy lại "npm run setup".`);
    console.log('Các giá trị đã nhập vẫn được giữ trong .env, lần sau chỉ cần bấm Enter.');
    process.exit(1);
  }
}

console.log(bold('\nCài đặt đăng nhập cho English Personal Coach'));
console.log('Làm theo từng bước. Mỗi bước mở một trang web, chép đúng giá trị in đậm vào ô tương ứng.');

// ---------- 1. Supabase ----------
step(1, 'Tạo project Supabase');
console.log('   Mở https://supabase.com/dashboard → New project.');
console.log('   Region: Southeast Asia (Singapore). Đặt mật khẩu database và GHI LẠI, bước 5 sẽ hỏi.');
console.log('   Tạo xong, vào Project Settings → API Keys (hoặc Data API) để lấy hai giá trị dưới đây.\n');
const url = await ask('PUBLIC_SUPABASE_URL', 'Project URL (dạng https://xxxx.supabase.co)', (v) =>
  /^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/.test(v) ? null : 'Chưa đúng dạng. Ví dụ: https://abcdefghijklmnopqrst.supabase.co',
);
env.PUBLIC_SUPABASE_URL = url.replace(/\/$/, '');
const ref = env.PUBLIC_SUPABASE_URL.slice('https://'.length, -'.supabase.co'.length);
await ask('PUBLIC_SUPABASE_ANON_KEY', 'Publishable key (sb_publishable_...) hoặc anon key', (v) =>
  v.length >= 20 && !v.startsWith('sb_secret_') ? null : 'Cần publishable key hoặc anon key. Không dán secret key.',
);
env.PUBLIC_SITE_URL ??= SITE;
saveEnv();

const callback = `${env.PUBLIC_SUPABASE_URL}/auth/v1/callback`;

// ---------- 2. GitHub ----------
step(2, 'Tạo ứng dụng đăng nhập GitHub (1 form)');
console.log('   Mở https://github.com/settings/applications/new và điền:');
copy('Application name', 'English Personal Coach');
copy('Homepage URL', SITE);
copy('Authorization callback URL', callback);
console.log('\n   Bấm "Register application". Ở trang tiếp theo bấm "Generate a new client secret".\n');
await ask('SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID', 'GitHub Client ID', (v) => (v.length >= 10 ? null : 'Client ID quá ngắn.'));
await ask('SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET', 'GitHub Client secret', (v) => (v.length >= 20 ? null : 'Client secret quá ngắn.'));

// ---------- 3. Google ----------
step(3, 'Tạo ứng dụng đăng nhập Google');
console.log('   a) Mở https://console.cloud.google.com/projectcreate, đặt tên "epc", bấm Create, chờ xong.');
console.log('   b) Mở https://console.cloud.google.com/auth/overview, chọn project "epc", bấm "Get started":');
copy('App name', 'English Personal Coach');
console.log('      User support email: chọn email của bạn. Audience: External. Contact: email của bạn. Bấm Create.');
console.log('   c) Mở https://console.cloud.google.com/auth/audience, bấm "Publish app" rồi Confirm.');
console.log('   d) Mở https://console.cloud.google.com/auth/clients/create:');
copy('Application type', 'Web application');
copy('Name', 'EPC');
copy('Authorized JavaScript origins (bấm Add URI hai lần)', `${SITE}   và   http://localhost:4321`);
copy('Authorized redirect URIs (Add URI)', callback);
console.log('\n   Bấm Create. Cửa sổ hiện Client ID và Client secret.\n');
await ask('SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID', 'Google Client ID (đuôi .apps.googleusercontent.com)', (v) =>
  v.endsWith('.apps.googleusercontent.com') ? null : 'Client ID của Google kết thúc bằng .apps.googleusercontent.com',
);
await ask('SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET', 'Google Client secret', (v) => (v.length >= 20 ? null : 'Client secret quá ngắn.'));

rl.close();

// ---------- 4-7. Tự động ----------
step(4, 'Đăng nhập Supabase CLI (trình duyệt sẽ mở, bấm xác nhận)');
run('Đăng nhập', 'npx', ['supabase', 'login']);

step(5, 'Kết nối project (hỏi mật khẩu database ở bước 1)');
run('Kết nối', 'npx', ['supabase', 'link', '--project-ref', ref]);

step(6, 'Tạo bảng và cấu hình đăng nhập');
run('Tạo bảng', 'npx', ['supabase', 'db', 'push'], { SUPABASE_YES: 'true' });
run('Bật GitHub, Google và địa chỉ chuyển về', 'npx', ['supabase', 'config', 'push'], { SUPABASE_YES: 'true' });

step(7, 'Deploy');
run('Build và deploy', 'npm', ['run', 'deploy']);

console.log(`\n${bold('Xong.')} Mở ${SITE}/dang-nhap và thử đăng nhập bằng GitHub và Google.\n`);
