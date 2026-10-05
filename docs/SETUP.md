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
- **Bí mật** (key service role, key AI, token bot...) chỉ đọc lúc chạy. Đặt cho production bằng `npx wrangler secret put <TÊN_BIẾN>`, cho máy local trong file `.dev.vars`. M2 chưa cần bí mật nào.

## M2: Supabase và đăng nhập Google, GitHub

Làm theo thứ tự. Thay `<ref>` bằng mã project Supabase, `<site>` bằng địa chỉ Cloudflare của bạn (hiện là `https://epc-app.englishfordev.workers.dev`).

### 1. Tạo project Supabase

1. Đăng ký tại https://supabase.com (gói Free), tạo project mới. Region chọn **Southeast Asia (Singapore)**. Đặt mật khẩu database và **lưu lại**, bước 2 cần đến.
2. Vào **Project Settings → API Keys**. Ghi lại:
   - **Project URL**, dạng `https://<ref>.supabase.co`. `<ref>` là phần trước `.supabase.co`.
   - **Publishable key** (`sb_publishable_...`). Nếu project chỉ có key kiểu cũ thì dùng **anon key**.
   Không cần lấy secret key hay service role key ở M2.
3. Tạo file `epc-app/.env`:

   ```bash
   PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=<publishable key hoặc anon key>
   PUBLIC_SITE_URL=<site>
   ```

Gói Free tạm dừng project sau 7 ngày không có hoạt động. Từ M6, worker cron sẽ giữ project hoạt động. Trước đó, nếu project bị dừng thì vào dashboard bấm **Restore**.

### 2. Tạo bảng (chạy migration)

Không cần Docker. Trong thư mục `epc-app`:

```bash
npx supabase login
npx supabase link --project-ref <ref>     # hỏi mật khẩu database ở bước 1
npx supabase db push --dry-run            # xem trước: phải thấy 20261005120000_init.sql
npx supabase db push
```

Kiểm lại: dashboard → **Table Editor** có 7 bảng `profiles`, `entitlements`, `lesson_progress`, `review_items`, `corrections`, `orders`, `events`. Mỗi bảng có nhãn RLS đang bật.

Các lần sau, mỗi file mới trong `supabase/migrations/` chỉ cần chạy lại `npx supabase db push`.

### 3. Đăng nhập bằng GitHub

1. Mở https://github.com/settings/developers → **OAuth Apps → New OAuth App**.
   - Application name: `English Personal Coach`
   - Homepage URL: `<site>`
   - Authorization callback URL: `https://<ref>.supabase.co/auth/v1/callback`
2. Bấm **Register application**, rồi **Generate a new client secret**. Ghi lại Client ID và Client secret.
3. Supabase → **Authentication → Providers** (có bản giao diện ghi **Sign In / Providers**) → **GitHub**: bật lên, dán Client ID và Client secret, bấm **Save**.

### 4. Đăng nhập bằng Google

1. Mở https://console.cloud.google.com, tạo project mới (ví dụ `epc`).
2. **APIs & Services → OAuth consent screen** (hoặc **Google Auth Platform**): chọn **External**, điền tên ứng dụng `English Personal Coach` và email hỗ trợ. Phạm vi chỉ cần `email`, `profile`, `openid`. Ở mục **Audience**, bấm **Publish app** để người ngoài đăng nhập được. Nếu để chế độ Testing thì chỉ email trong danh sách test user mới đăng nhập được.
3. **Clients → Create client**, loại **Web application**:
   - Authorized JavaScript origins: `<site>` và `http://localhost:4321`
   - Authorized redirect URIs: `https://<ref>.supabase.co/auth/v1/callback`
4. Ghi lại Client ID và Client secret. Supabase → **Authentication → Providers → Google**: bật lên, dán vào, bấm **Save**.

### 5. Địa chỉ được phép chuyển về

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `<site>`
- **Redirect URLs**, thêm hai dòng:
  - `<site>/auth/callback**`
  - `http://localhost:4321/auth/callback**`

### 6. Deploy và kiểm

```bash
npm run deploy
```

Mở `<site>/dang-nhap`, đăng nhập bằng từng cách. Lần đầu sẽ vào test xếp trình độ, sau đó tới trang Hôm nay.

Chạy local: `npm run dev`, mở http://localhost:4321.

### Xóa tài khoản khi người dùng yêu cầu

Supabase → **Authentication → Users**, tìm theo email, bấm **Delete user**. Mọi dòng dữ liệu của người đó bị xóa theo (khóa ngoại `on delete cascade`). Riêng bảng `events` giữ lại sự kiện nhưng bỏ liên kết với người dùng.
