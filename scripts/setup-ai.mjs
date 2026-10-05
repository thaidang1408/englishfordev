// Bật tính năng AI sửa câu (M4) trong một lệnh: npm run setup:ai
// Mặc định dùng Workers AI miễn phí, không cần key. Key Anthropic chỉ cần nếu muốn dùng Claude.
// Script tự lấy service role key của Supabase qua CLI, tạo hàm mới trong database,
// đặt secret trên Cloudflare, ghi .dev.vars cho máy bạn, rồi deploy.
// Không in key ra màn hình. Chạy lại được nhiều lần.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const DEV_VARS = '.dev.vars'; // secret cho npm run dev, đã nằm trong .gitignore
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
  console.log('Sửa xong thì chạy lại "npm run setup:ai". Lần sau chỉ cần bấm Enter ở các câu hỏi.');
  process.exit(1);
}

function run(title, cmd, args, opts = {}) {
  console.log(`\n→ ${title}\n  $ ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: { ...process.env, ...opts.env } });
  if (r.status !== 0) stop('Lệnh trên chưa chạy được. Đọc thông báo lỗi phía trên.');
}

/** Đặt một secret trên Cloudflare, truyền giá trị qua stdin để không hiện trong lệnh. */
function putSecret(name, value) {
  console.log(`\n→ Đặt secret ${name} trên Cloudflare`);
  const r = spawnSync('npx', ['wrangler', 'secret', 'put', name], {
    input: `${value}\n`,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });
  if (r.status !== 0) stop(`Chưa đặt được secret ${name}. Kiểm tra bạn đã đăng nhập Cloudflare bằng "npx wrangler login".`);
}

const vars = readVars(DEV_VARS);

console.log(bold('\nBật AI sửa câu cho English Personal Coach'));

// ---------- 1. Key Anthropic (không bắt buộc) ----------
step(1, 'Chọn AI sửa câu');
console.log('   Mặc định dùng Workers AI của Cloudflare: miễn phí, khoảng 1.000 câu mỗi ngày, không cần key.');
console.log('   Chỉ khi muốn dùng Claude (trả phí theo lượt) mới cần key Anthropic:');
console.log('   https://console.anthropic.com/settings/keys, nạp tiền, đặt Spend limit, tạo key bắt đầu bằng sk-ant-.');
let apiKey = '';
for (;;) {
  const hint = vars.ANTHROPIC_API_KEY ? ' (Enter để giữ key đã dán lần trước, gõ "bo" để bỏ)' : ' (Enter để bỏ qua, dùng AI miễn phí)';
  const answer = (await rl.question(`   Key Anthropic${hint}: `)).trim();
  apiKey = answer === 'bo' ? '' : answer || vars.ANTHROPIC_API_KEY || '';
  if (apiKey === '' || /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(apiKey)) break;
  console.log('   Key phải bắt đầu bằng sk-ant- và không có khoảng trắng. Thử lại, hoặc bấm Enter để bỏ qua.');
}
console.log(apiKey ? '   Dùng Claude.' : '   Dùng Workers AI miễn phí của Cloudflare.');
rl.close();

// ---------- 2. Service role key ----------
step(2, 'Lấy service role key của Supabase (tự động)');
const refFile = 'supabase/.temp/project-ref';
if (!existsSync(refFile)) stop('Máy này chưa kết nối project Supabase. Chạy "npm run setup" trước.');
const ref = readFileSync(refFile, 'utf8').trim();
const keys = spawnSync('npx', ['supabase', 'projects', 'api-keys', '--project-ref', ref, '--reveal', '-o', 'json'], {
  encoding: 'utf8',
  shell: true,
});
let serviceKey = '';
try {
  const list = JSON.parse(keys.stdout);
  const all = Array.isArray(list) ? list : [];
  // Ưu tiên secret key kiểu mới (sb_secret_), không có thì dùng service_role kiểu cũ.
  const pick = all.find((k) => k.type === 'secret') ?? all.find((k) => k.name === 'service_role');
  serviceKey = typeof pick?.api_key === 'string' && /^(sb_secret_|eyJ)[A-Za-z0-9._-]{20,}$/.test(pick.api_key) ? pick.api_key : '';
} catch {
  serviceKey = '';
}
if (!serviceKey) stop('Chưa lấy được service role key. Kiểm tra "npx supabase login" còn hiệu lực.');
console.log('   Đã lấy được service role key. Key này chỉ nằm trên máy chủ, không tới trình duyệt.');

// Giữ các secret khác trong .dev.vars (ví dụ của npm run setup:pay), chỉ cập nhật hai key của AI.
const merged = { ...vars, SUPABASE_SERVICE_ROLE_KEY: serviceKey };
if (apiKey) merged.ANTHROPIC_API_KEY = apiKey;
else delete merged.ANTHROPIC_API_KEY;
writeFileSync(
  DEV_VARS,
  ['# Secret cho npm run dev. Không commit file này.', ...Object.entries(merged).map(([k, v]) => `${k}=${v}`), ''].join('\n'),
);

// ---------- 3. Database ----------
step(3, 'Tạo hàm lưu kết quả sửa câu trong database');
run('Áp dụng migration mới', 'npx', ['supabase', 'db', 'push'], { env: { SUPABASE_YES: 'true' } });

// ---------- 4. Cloudflare ----------
step(4, 'Đặt secret trên Cloudflare');
putSecret('SUPABASE_SERVICE_ROLE_KEY', serviceKey);
if (apiKey) putSecret('ANTHROPIC_API_KEY', apiKey);
else if (vars.ANTHROPIC_API_KEY) {
  // Trước đây có key, giờ bỏ: xóa secret để máy chủ chuyển sang Workers AI.
  spawnSync('npx', ['wrangler', 'secret', 'delete', 'ANTHROPIC_API_KEY'], { input: 'y\n', stdio: ['pipe', 'inherit', 'inherit'], shell: true });
}

// ---------- 5. Deploy ----------
step(5, 'Deploy');
run('Build và đưa lên Cloudflare', 'npm', ['run', 'deploy']);

console.log(`\n${bold('Xong.')} Mở /hom-nay, gõ một câu vào ô "Sửa câu của tôi" để thử.`);
