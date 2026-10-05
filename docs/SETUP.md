# Cài đặt và deploy

Tài liệu này dành cho chủ dự án. Mỗi milestone cần thêm tài khoản bên ngoài sẽ thêm một mục vào đây.

## Yêu cầu trên máy

- Node.js 22.12 trở lên (`node -v`).
- Đã chạy `npm install` trong thư mục `epc-app`.

## M0: Deploy lên Cloudflare

Gói Workers miễn phí là đủ, không cần thẻ.

1. Tạo tài khoản tại https://dash.cloudflare.com/sign-up và xác nhận email.
2. Trong thư mục `epc-app`, đăng nhập wrangler:

   ```bash
   npx wrangler login
   ```

   Trình duyệt mở trang Cloudflare, bấm **Allow**. Kiểm lại bằng `npx wrangler whoami`, phải thấy email của bạn.
3. Build và deploy:

   ```bash
   npm run deploy
   ```

   Lần đầu, nếu tài khoản chưa có subdomain `workers.dev`, wrangler sẽ hỏi tên subdomain. Chọn một tên bất kỳ, ví dụ tên của bạn.
4. Cuối lệnh, wrangler in ra một địa chỉ dạng `https://epc-app.<subdomain>.workers.dev`. Mở địa chỉ đó trên điện thoại và máy tính. Thấy dòng "Trang này chỉ để kiểm tra bản deploy" là xong M0.

Tên worker là `epc-app`, đặt trong `wrangler.jsonc`. Muốn đổi thì sửa trường `name` trước khi deploy lần đầu.

Tên miền riêng chưa cần ở bản 1. Khi cần: Cloudflare dashboard → Workers & Pages → `epc-app` → Settings → Domains & Routes.

## Biến môi trường

Danh sách đầy đủ ở `.env.example`. Có hai loại:

- **Biến `PUBLIC_`** được nhúng vào bản build. Đặt trong file `.env` ở thư mục `epc-app` (đã nằm trong `.gitignore`). `npm run dev` và `npm run deploy` đều đọc file này. Đổi giá trị thì phải deploy lại.
- **Bí mật** (key service role, key AI, token bot...) chỉ đọc lúc chạy. Đặt cho production bằng `npx wrangler secret put <TÊN_BIẾN>`, cho máy local trong file `.dev.vars`. Từ M4 có hai bí mật: `SUPABASE_SERVICE_ROLE_KEY` và `ANTHROPIC_API_KEY`, đặt bằng `npm run setup:ai`.

## M2: Supabase và đăng nhập Google, GitHub

Chỉ cần một lệnh, trong thư mục `epc-app`:

```bash
npm run setup
```

Lệnh này dẫn bạn từng bước và in đậm đúng giá trị cần chép vào từng ô. Bạn chỉ phải tự làm ba việc trên web:

1. **Tạo project Supabase** (gói Free, region Singapore). Nhớ mật khẩu database. Dán vào lệnh: Project URL và publishable key.
2. **Điền một form trên GitHub** để tạo ứng dụng đăng nhập. Dán vào lệnh: Client ID và Client secret.
3. **Tạo ứng dụng đăng nhập trên Google Cloud** (4 trang, lệnh in sẵn link từng trang). Dán vào lệnh: Client ID và Client secret.

Sau đó lệnh tự làm hết phần còn lại: đăng nhập Supabase CLI (trình duyệt mở ra, bạn bấm xác nhận), kết nối project (hỏi mật khẩu database), tạo bảng, bật đăng nhập GitHub và Google, khai báo địa chỉ chuyển về, rồi deploy.

Lỗi ở bước nào thì lệnh dừng và nói lý do. Sửa xong chạy lại `npm run setup`, các giá trị đã nhập được giữ, chỉ cần bấm Enter.

Các giá trị được lưu ở hai file, cả hai đều không commit:

- `.env`: Project URL, publishable key, địa chỉ site. Được nhúng vào bản build.
- `.env.setup`: Client ID và secret của GitHub, Google. Chỉ dùng khi đẩy cấu hình lên Supabase, không vào bản build.

Cấu hình đăng nhập phía Supabase nằm trong `supabase/config.toml`. Đổi tên miền thì sửa file này và `SITE` trong `scripts/setup.mjs`, rồi chạy lại lệnh.

Gói Free tạm dừng project sau 7 ngày không có hoạt động. Từ M6, worker cron sẽ giữ project chạy. Trước đó, nếu project bị dừng thì vào dashboard Supabase bấm **Restore**.

Thêm migration mới sau này: `npx supabase db push`.

## M4: AI sửa câu

Chỉ cần một lệnh, trong thư mục `epc-app`, sau khi đã chạy `npm run setup` ở M2:

```bash
npm run setup:ai
```

Bạn chỉ phải tự làm một việc trên web: **lấy key Anthropic**.

1. Mở https://console.anthropic.com/settings/keys và đăng nhập.
2. Vào **Billing**, nạp tiền (ví dụ 5 USD) và đặt **Spend limit** theo tháng.
3. Quay lại **API keys**, bấm **Create Key**, đặt tên `epc`, chép key bắt đầu bằng `sk-ant-` rồi dán vào lệnh.

Lệnh tự làm phần còn lại:

- Lấy secret key của Supabase qua CLI. Key này cho server ghi kết quả sửa câu, không bao giờ tới trình duyệt.
- Áp dụng migration `20261005130000_save_correction.sql` (`npx supabase db push`).
- Đặt hai secret trên Cloudflare (`npx wrangler secret put`): `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
- Ghi hai key vào `.dev.vars` để `npm run dev` trên máy bạn sửa câu được. File này không commit.
- Deploy.

Thiếu một trong hai key thì ô sửa câu báo "Tính năng sửa câu đang tạm tắt" và không trừ lượt.

Hai biến tùy chọn, không đặt thì dùng mặc định:

- `AI_MODEL`: mặc định `claude-haiku-4-5-20251001`.
- `AI_DAILY_CALL_CAP`: tổng lượt sửa toàn hệ thống mỗi ngày, mặc định 500. Đổi bằng `npx wrangler secret put AI_DAILY_CALL_CAP`.

Hạn mức mỗi tài khoản (SPEC mục 7): Premium 30 lần mỗi ngày, dùng thử 10 lần mỗi ngày, miễn phí 1 lần mỗi 7 ngày. "Ngày" tính theo giờ Việt Nam.

### Thử hạn mức bằng tay

Trong Supabase → **SQL Editor** (thay email cho đúng):

```sql
-- Cho tài khoản hết dùng thử ngay
update public.entitlements set trial_until = now() - interval '1 minute'
where user_id = (select id from auth.users where email = 'ban@example.com');

-- Trả lại dùng thử 7 ngày
update public.entitlements set trial_until = now() + interval '7 days'
where user_id = (select id from auth.users where email = 'ban@example.com');

-- Đưa các mục ôn own_error về hạn hôm nay để thử phần ôn
update public.review_items set due_at = now() - interval '1 minute'
where kind = 'own_error' and user_id = (select id from auth.users where email = 'ban@example.com');
```

### Xóa tài khoản khi người dùng yêu cầu

Supabase → **Authentication → Users**, tìm theo email, bấm **Delete user**. Mọi dòng dữ liệu của người đó bị xóa theo (khóa ngoại `on delete cascade`). Riêng bảng `events` giữ lại sự kiện nhưng bỏ liên kết với người dùng.
