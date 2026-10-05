# Checklist ra mắt

M7 xong khi mọi dòng dưới đây được đánh dấu `[x]` (SPEC mục 12). Dòng đã đánh dấu là Claude Code đã kiểm trên máy lúc làm M7. Dòng còn trống là việc của chủ dự án, cần tài khoản thật hoặc quyết định của bạn.

## Code và build (Claude Code đã kiểm)

- [x] `npm run check`, `npm run test`, `npm run build` đều qua.
- [x] `npm run test:e2e` qua trên bản build.
- [x] Không có secret (service role key, key AI, payOS, Telegram, CRON_SECRET) trong `dist/client`.
- [x] Đủ 30 bài và `placement.json`, qua kiểm schema lúc build. Chỉ standup 1 đến 3 là bài miễn phí.
- [x] Trang `/dieu-khoan`, `/bao-mat` có link ở chân mọi trang.
- [x] `/sitemap.xml` liệt kê trang công khai, `/robots.txt` trỏ tới sitemap. Trang trong app có `noindex`.
- [x] Thẻ OG có ảnh `og.png` 1200x630, favicon và icon cho iPhone.
- [x] Sự kiện phễu ghi đúng 13 tên ở SPEC mục 10, không có câu người dùng viết. Bảng phễu 7 và 30 ngày trong `/admin` (test với database thật trong bộ nhớ).

## Đưa lên bản thật (việc của bạn)

- [ ] Đã chạy `npm run setup:ai`, `npm run setup:pay`, `npm run setup:bot` (mỗi lệnh một lần, theo `docs/SETUP.md`).
- [ ] Đã chạy `npm run release` sau cùng: áp dụng migration M7 và deploy bản mới nhất.
- [ ] `ADMIN_EMAILS` có email của bạn; mở `/admin` thấy bảng phễu và danh sách đơn.
- [ ] Đăng nhập Google và GitHub chạy trên tên miền thật (Redirect URL trong Supabase đúng `PUBLIC_SITE_URL`).

## Thử trên bản thật (việc của bạn)

- [ ] Học bài 1 trên điện thoại khi chưa đăng nhập, rồi đăng nhập: tiến độ còn nguyên.
- [ ] Sửa một câu: có kết quả, câu vào `/so-loi`.
- [ ] Mua gói 30 ngày bằng chuyển khoản thật: Premium tự mở. Rồi bấm "Hoàn tiền" trong `/admin` và tự chuyển trả.
- [ ] Liên kết Telegram, nhận tin nhắc, gọi tay báo cáo tuần, gõ `/stop`.
- [ ] Sau các bước trên, `/admin` hiện số ở các bước phễu (khách, bắt đầu bài 1, xong bài 1, đăng ký, xong test, sửa câu, tạo đơn, trả tiền).
- [ ] Dán link trang chủ vào Telegram hoặc Facebook: hiện ảnh và tiêu đề.
- [ ] Lighthouse mobile cho `/` từ 90 ở cả bốn mục (mở https://pagespeed.web.dev, dán link bản thật).

## Nội dung và pháp lý (việc của bạn)

- [ ] Duyệt hết `docs/CONTENT_REVIEW.md`: 27 bài mới, `placement.json`, hai trang điều khoản và bảo mật. Mọi dòng ở đó là `[x]`.
- [ ] Đồng ý các cam kết trong `/dieu-khoan` và `/bao-mat`: hoàn tiền 3 ngày, xóa dữ liệu trong 7 ngày, báo trước 30 ngày nếu ngừng.

## Sau khi ra mắt

- [ ] Ghi ngày ra mắt. Sau 30 ngày, đọc bảng phễu và so với ngưỡng ở SPEC mục 13.
