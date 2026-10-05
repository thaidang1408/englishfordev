---
name: api-endpoint
description: Khuôn bắt buộc cho mọi endpoint server của EPC trong src/pages/api. Dùng khi tạo hoặc sửa endpoint, webhook, hoặc bất kỳ code nào nhận request từ trình duyệt hay dịch vụ ngoài.
---

# Viết một endpoint

Mọi endpoint đi đúng bảy bước theo thứ tự này. Bỏ bước nào phải ghi lý do trong comment.

1. **Phương thức:** chỉ nhận đúng method đã khai trong SPEC mục 3. Method khác trả 405.
2. **Nguồn gốc:** với POST từ trình duyệt, kiểm header `Origin` trùng `PUBLIC_SITE_URL`. Webhook Telegram kiểm secret token trong header. Cron kiểm `CRON_SECRET`. So sánh secret bằng hàm so sánh thời gian hằng.
3. **Danh tính:** lấy người dùng từ session ở server qua `lib/auth`. Không bao giờ nhận `user_id` từ body hay query. Chưa đăng nhập trả 401.
4. **Dữ liệu vào:** parse body bằng schema zod, có giới hạn độ dài cho mọi chuỗi. Sai trả 400 kèm thông báo tiếng Việt, không lộ chi tiết schema.
5. **Quyền và hạn mức:** kiểm Premium, hạn mức, quyền admin bằng dữ liệu đọc từ database ngay lúc đó. Không đủ quyền trả 403, hết hạn mức trả 429.
6. **Việc chính:** gọi hàm trong `lib/`. Ghi nhiều bảng thì dùng một hàm Postgres hoặc thứ tự ghi an toàn khi hỏng giữa chừng. Việc trừ lượt chỉ xảy ra sau khi việc chính thành công.
7. **Phản hồi:** luôn là JSON cùng một dạng.

```ts
// thành công
{ ok: true, data: ... }
// thất bại
{ ok: false, error: { code: "quota_exceeded", message: "Bạn đã dùng hết lượt sửa của tuần này." } }
```

`code` là chuỗi cố định bằng tiếng Anh để client rẽ nhánh. `message` là câu hiển thị cho người dùng. Lỗi không lường trước trả 500 với `code: "internal"` và một câu chung, chi tiết chỉ vào log.

## Luôn có

- Header `Cache-Control: no-store` cho mọi phản hồi có dữ liệu người dùng.
- Test cho từng nhánh: 401, 400, 403 hoặc 429, và đường thành công. Xem skill `testing`.
- Endpoint admin kiểm email trong `ADMIN_EMAILS` ở server ở mỗi request, không dựa vào việc ẩn nút.

## Không bao giờ

- Tin giá tiền, gói, trạng thái đơn, ngày hết hạn gửi từ client. Server tự tính từ `plan`.
- Trả về dòng dữ liệu của người khác, kể cả khi client "không hiển thị".
- Để endpoint ghi dữ liệu chạy được bằng GET.
