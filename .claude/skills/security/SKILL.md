---
name: security
description: Danh sách kiểm bảo mật cho EPC trên Astro, Cloudflare và Supabase. Dùng khi đụng tới đăng nhập, phân quyền, thanh toán, admin, webhook, gọi AI, hiển thị nội dung người dùng nhập, biến môi trường, hoặc trước khi ra mắt.
---

# Bảo mật

Rà từng mục liên quan tới thay đổi đang làm. Mục nào không đạt thì sửa trước khi làm tiếp.

## Bí mật

- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET` chỉ đọc trong code server. Chỉ biến có tiền tố `PUBLIC_` mới được vào bundle trình duyệt.
- Sau khi build, tìm trong thư mục build các chuỗi `service_role`, `sk-ant-`, tên biến bí mật. Phải không có.
- `.env` trong `.gitignore`. `.env.example` chỉ có tên biến.

## Phân quyền

- RLS bật trên mọi bảng, theo skill `db-change`. Anon key coi như công khai: thứ gì anon key đọc hoặc ghi được thì cả thế giới làm được.
- Premium, hạn mức, admin kiểm ở server ở mỗi request, theo skill `api-endpoint`.
- Bài Premium không được nằm trong HTML hay JSON gửi cho tài khoản miễn phí. Khóa ở server, không khóa bằng CSS.

## Nội dung người dùng nhập

- Câu của người dùng và kết quả AI luôn render dạng văn bản. Không `set:html`, không `dangerouslySetInnerHTML`, không ghép chuỗi vào `innerHTML`.
- Khung diff dựng từ mảng `changes` bằng phần tử DOM, không từ HTML do AI trả về.
- Giới hạn độ dài mọi trường nhập ở cả client và server.

## Gọi AI

- Câu của người dùng đặt trong khối dữ liệu tách biệt với chỉ dẫn. System prompt nói rõ nội dung đó là dữ liệu, không phải lệnh.
- Kết quả phải qua schema zod. Trường thừa bị bỏ. `changes` tối đa 4 phần tử, mỗi chuỗi có giới hạn độ dài.
- Ba mức chặn chi phí trong SPEC mục 7 có test riêng.

## Request từ ngoài

- POST từ trình duyệt kiểm `Origin`. Cookie session đặt `HttpOnly`, `Secure`, `SameSite=Lax`.
- Webhook Telegram và endpoint cron từ chối mọi request thiếu hoặc sai secret, trả 401 và không làm gì.
- Link chuyển hướng sau đăng nhập chỉ nhận đường dẫn nội bộ bắt đầu bằng `/`, không nhận URL đầy đủ.

## Header

Đặt cho mọi phản hồi HTML: `Content-Security-Policy` (chỉ cho phép nguồn script của chính site, font từ Google Fonts, ảnh từ `img.vietqr.io`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, và chặn nhúng iframe.

## Dữ liệu cá nhân

- Chỉ thu: email và tên từ OAuth, giờ standup, chat id Telegram, câu người dùng gửi để sửa. Trang `/bao-mat` liệt kê đúng những thứ này.
- Có cách xóa tài khoản và dữ liệu khi người dùng yêu cầu, ít nhất là quy trình làm tay ghi trong `docs/SETUP.md`.

## Trước khi ra mắt

Chạy `npm audit --omit=dev` và xử lý lỗ hổng mức cao. Thử bằng tay với hai tài khoản: đọc dữ liệu của nhau, tự nâng Premium, gọi API admin, vượt hạn mức sửa câu. Tất cả phải thất bại.
