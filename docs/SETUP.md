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
- **Bí mật** (key service role, key AI, token bot...) chỉ đọc lúc chạy. Đặt cho production bằng `npx wrangler secret put <TÊN_BIẾN>`, cho máy local trong file `.dev.vars`. Từ M4 có bí mật `SUPABASE_SERVICE_ROLE_KEY` (và `ANTHROPIC_API_KEY` nếu dùng Claude), đặt bằng `npm run setup:ai`.

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

Mặc định dùng **Cloudflare Workers AI**, miễn phí trong hạn mức 10.000 neuron mỗi ngày (khoảng 1.000 lần sửa với model Gemma 4), không cần key và không cần tài khoản mới. Kết quả so sánh model ở `docs/AI_MODEL_EVAL.md`.

Chỉ cần một lệnh, trong thư mục `epc-app`, sau khi đã chạy `npm run setup` ở M2:

```bash
npm run setup:ai
```

Lệnh hỏi key Anthropic: **bấm Enter để bỏ qua** và dùng AI miễn phí. Sau đó lệnh tự làm:

- Lấy secret key của Supabase qua CLI. Key này cho server ghi kết quả sửa câu, không bao giờ tới trình duyệt.
- Áp dụng migration `20261005130000_save_correction.sql` (`npx supabase db push`).
- Đặt secret `SUPABASE_SERVICE_ROLE_KEY` trên Cloudflare (`npx wrangler secret put`).
- Ghi key vào `.dev.vars` để `npm run dev` trên máy bạn sửa câu được. File này không commit.
- Deploy. Binding Workers AI đã khai trong `wrangler.jsonc` (`"ai": { "binding": "AI" }`).

Thiếu secret key Supabase thì ô sửa câu báo "Tính năng sửa câu đang tạm tắt" và không trừ lượt.

Khi chạy `npm run dev`, Workers AI vẫn gọi lên Cloudflare thật và tính vào hạn mức miễn phí của ngày.

**Gói Cloudflare:** với gói Workers Free, vượt 10.000 neuron trong ngày thì lời gọi bị từ chối, không mất tiền; người dùng thấy "Chưa sửa được câu này", lượt không bị trừ. Nếu sau này nâng lên gói Workers Paid, phần vượt bị tính 0,011 USD cho 1.000 neuron. `AI_DAILY_CALL_CAP` mặc định 500 lần, nằm dưới hạn mức miễn phí.

**Muốn dùng Claude thay cho Workers AI** (trả phí theo lượt, khoảng 60 đồng một lần sửa): chạy lại `npm run setup:ai` và dán key Anthropic.

1. Mở https://console.anthropic.com/settings/keys và đăng nhập.
2. Vào **Billing**, nạp tiền và đặt **Spend limit** theo tháng.
3. Quay lại **API keys**, bấm **Create Key**, chép key bắt đầu bằng `sk-ant-`.

Có key Anthropic thì máy chủ dùng Claude. Muốn quay về Workers AI thì chạy lại lệnh và gõ `bo` ở câu hỏi key.

Biến tùy chọn, không đặt thì dùng mặc định:

- `AI_MODEL`: model của nhà cung cấp đang dùng. Mặc định `@cf/google/gemma-4-26b-a4b-it` (Workers AI) hoặc `claude-haiku-4-5-20251001` (Anthropic).
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

## M5: Thanh toán payOS và trang admin

Thanh toán dùng **payOS**: miễn phí, tài khoản cá nhân, tạo mã VietQR riêng cho từng đơn. Khi tiền vào đúng số, payOS báo về máy chủ và tài khoản tự mở Premium. Tiền vào thẳng tài khoản MB của bạn.

Cần chạy `npm run setup` (M2) và `npm run setup:ai` (M4) trước. Sau đó, trong thư mục `epc-app`:

```bash
npm run setup:pay
```

Bạn tự làm trên web, khoảng 10 phút:

1. Mở https://my.payos.vn, đăng ký tài khoản cá nhân bằng CCCD.
2. Liên kết tài khoản ngân hàng **MB** theo hướng dẫn trên trang payOS. BIDV cũng được, nhưng MB là ngân hàng liên kết đầu tiên của payOS nên đơn giản nhất.
3. Vào **Kênh thanh toán** → **Tạo kênh thanh toán**, đặt tên `EPC`, chọn tài khoản vừa liên kết. Ô Webhook URL để trống.
4. Mở kênh vừa tạo, chép **Client ID**, **Api Key**, **Checksum Key** dán vào lệnh.
5. Lệnh hỏi email admin: nhập email bạn dùng để đăng nhập EPC. Chỉ email này vào được `/admin`.

Lệnh tự làm phần còn lại:

- Áp dụng migration `20261005150000_orders_payos.sql`.
- Đặt 4 secret trên Cloudflare: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `ADMIN_EMAILS`.
- Ghi vào `.dev.vars` cho máy bạn.
- Deploy.
- Đăng ký địa chỉ webhook `https://<site>/api/payos/webhook` với payOS.

### Khi có người chuyển khoản

- **Bình thường:** không phải làm gì. Đơn tự thành "Đã trả", Premium tự mở. Trang `/nang-cap` của người mua tự đổi sang "Đã nhận".
- **Người mua chuyển sai nội dung hoặc thiếu tiền:** đơn vẫn "Chờ". Bạn kiểm tiền trong app MB, rồi vào `/admin` bấm **Đã nhận tiền** ở đơn đó.
- **Hoàn tiền** (trong 3 ngày đầu, SPEC mục 2): vào `/admin` bấm **Hoàn tiền**. Premium của người đó hết ngay. Bạn tự chuyển trả tiền qua app MB.

### Thử thanh toán thật với số tiền nhỏ

payOS không có môi trường thử riêng. Cách thử an toàn: mua gói 30 ngày bằng chính tài khoản của bạn, quét mã QR bằng app BIDV (chuyển từ BIDV sang tài khoản MB của chính bạn), xem Premium tự mở, rồi vào `/admin` bấm **Hoàn tiền** để đưa tài khoản về như cũ.

### Thử mất quyền Premium

Trong Supabase → **SQL Editor**, câu SQL "Cho tài khoản hết dùng thử ngay" ở mục M4. Tải lại `/hom-nay`: bài Premium hiện khóa, sổ lỗi chỉ hiện 3 lỗi gần nhất, dữ liệu vẫn còn.

## M6: Bot Telegram, nhắc học, báo cáo tuần

Cần chạy `npm run setup:ai` trước. Sau đó, trong thư mục `epc-app`:

```bash
npm run setup:bot
```

Bạn tự làm một việc trong Telegram, khoảng 2 phút:

1. Tìm **@BotFather** (có dấu tích xanh), bấm Start.
2. Gõ `/newbot`. Đặt tên hiển thị, ví dụ `English Personal Coach`.
3. Đặt username kết thúc bằng `bot`, ví dụ `epc_coach_bot`.
4. Chép token BotFather gửi, dán vào lệnh.

Lệnh tự làm phần còn lại:

- Kiểm token với Telegram và lấy username của bot.
- Tạo ngẫu nhiên `TELEGRAM_WEBHOOK_SECRET` và `CRON_SECRET`.
- Áp dụng migration `20261005170000_telegram.sql` (cột ngày đã nhắc, ngày đã báo cáo).
- Đặt 4 secret cho app: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`.
- Deploy app.
- Deploy worker cron `epc-cron` (thư mục `cron/`, chạy mỗi 15 phút), đặt `CRON_SECRET` cho worker đó.
- Đăng ký webhook `https://<site>/api/telegram/webhook` với Telegram.

Việc cuối cùng: mở `/tai-khoan`, bấm **Liên kết Telegram**, bấm Start trong Telegram. Bạn là admin (`ADMIN_EMAILS`), nên tin nhắn liên hệ người dùng gửi cho bot sẽ được chuyển tới chat này.

### Bot làm gì

- **Nhắc học:** thứ Hai đến thứ Sáu, trước giờ standup 30 đến 45 phút, nếu hôm đó người dùng chưa học bài. Mỗi người tối đa một tin mỗi ngày.
- **Báo cáo tuần:** Chủ nhật 20:00 cho Premium và người đang dùng thử, nếu tuần đó có câu được sửa.
- **Liên hệ:** người dùng nhắn bất kỳ tin thường nào cho bot (ví dụ chuyển sai nội dung, xin hoàn tiền), bot chuyển nguyên tin tới chat của admin. Bạn trả lời người đó trực tiếp trong Telegram, qua username hiện ở tin chuyển tới.
- `/stop`: người dùng gỡ liên kết, tắt nhắc.
- Mỗi lần cron chạy còn có một truy vấn nhẹ vào Supabase, đủ để project gói Free không bị tạm dừng.

### Thử bằng tay

**Nhắc học:** ở `/tai-khoan`, đặt giờ standup sau giờ hiện tại khoảng 40 phút (vào ngày thường), lưu. Trong vòng 15 phút bạn nhận đúng một tin. Muốn thử lại cùng ngày, xóa dấu đã nhắc trong Supabase → **SQL Editor**:

```sql
update public.profiles set reminded_on = null
where id = (select id from auth.users where email = 'ban@example.com');
```

**Báo cáo tuần (gọi tay):** lấy `CRON_SECRET` trong file `.dev.vars`, rồi chạy (thay giá trị):

```bash
curl -X POST "https://<site>/api/cron/tick?task=report" -H "Authorization: Bearer <CRON_SECRET>" -H "Content-Type: application/json" -d "{}"
```

Tài khoản Premium hoặc đang dùng thử, đã liên kết Telegram, có câu được sửa trong 7 ngày qua, nhận đúng một tin. Gọi lại trong cùng ngày không gửi thêm. Muốn thử lại thì đặt `reported_on = null` như câu SQL ở trên.

**Xem worker cron chạy:** Cloudflare dashboard → Workers → `epc-cron` → Logs, hoặc `npx wrangler tail epc-cron`.

### Xóa tài khoản khi người dùng yêu cầu

Supabase → **Authentication → Users**, tìm theo email, bấm **Delete user**. Mọi dòng dữ liệu của người đó bị xóa theo (khóa ngoại `on delete cascade`). Riêng bảng `events` giữ lại sự kiện nhưng bỏ liên kết với người dùng.

## M7: Phễu, trang pháp lý, ra mắt

M7 có một migration mới (`20261005190000_events_funnel.sql`): ghi sự kiện phễu bằng trigger và hàm tính bảng phễu cho `/admin`. Sau khi đã chạy xong `setup:ai`, `setup:pay`, `setup:bot`, chạy một lệnh:

```bash
npm run release
```

Lệnh này áp dụng migration mới lên Supabase (hỏi xác nhận, gõ `Y`), rồi build và deploy app. Chạy lại lệnh này mỗi khi có bản mới.

Sau đó làm theo `docs/LAUNCH_CHECKLIST.md`.

### Bảng phễu đọc thế nào

- Mỗi bước đếm số người khác nhau trong 7 hoặc 30 ngày. Khách chưa đăng nhập được nhận ra bằng một mã ngẫu nhiên lưu trên trình duyệt, nên đổi máy hoặc xóa dữ liệu trình duyệt thì tính là người mới.
- "Sửa câu lần đầu": người có câu được sửa đầu tiên trong khoảng thời gian đó.
- "Quay lại ngày N": người đăng ký có hoạt động đúng ngày thứ N sau ngày đăng ký (giờ Việt Nam).
- Nguồn giới thiệu: thêm `?src=ten-nguon` vào link bạn chia sẻ, ví dụ `/?src=fb-group`. Muốn xem theo nguồn, chạy trong Supabase → **SQL Editor**:

```sql
select props->>'src' as src, count(distinct anon_id) as nguoi
from public.events where name = 'page_view' and created_at > now() - interval '30 days'
group by 1 order by 2 desc;
```
