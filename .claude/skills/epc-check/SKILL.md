---
name: epc-check
description: Kiểm tra chất lượng trước khi báo xong việc hoặc trước khi commit trong dự án EPC. Dùng sau mỗi thay đổi đáng kể, cuối mỗi milestone, và khi được hỏi "đã xong chưa".
---

# Kiểm tra trước khi báo xong

Chạy lần lượt. Một bước hỏng thì sửa rồi chạy lại từ đầu.

```bash
npm run check
npm run test
npm run build
```

Sau đó rà tay các điểm sau và ghi kết quả từng dòng (đạt, không đạt, không áp dụng):

1. **Bí mật:** `git grep -nE "service_role|sk-ant-|BOT_TOKEN=.+|eyJhbGci" -- . ':!*.example'` không ra kết quả nào ngoài tên biến. `SUPABASE_SERVICE_ROLE_KEY` và key AI không xuất hiện trong code chạy ở trình duyệt.
2. **Quyền ở server:** mọi endpoint đọc người dùng từ session ở server, không nhận `user_id` từ body. Bài Premium, hạn mức sửa câu và trang admin đều bị chặn khi gọi thẳng API bằng tài khoản không đủ quyền.
3. **RLS:** bảng mới đã bật RLS và có test hai người dùng không đọc được dữ liệu của nhau.
4. **Nội dung:** mọi file trong `content/` qua được schema zod. Không có nội dung bài học nằm trong component.
5. **Giao diện:** trang vừa sửa xem được ở bề rộng 375px, không cuộn ngang. Điều hướng được bằng bàn phím. Trang công khai vẫn đọc được khi tắt JavaScript.
6. **Chữ và hình thức:** tuân theo skill `ui-vi` và `design-system`. Trang nhìn thấy được đã qua `design-review`.
7. **Chuẩn kỹ thuật:** code mới theo `code-standards`, endpoint theo `api-endpoint`, thay đổi nhạy cảm đã rà `security`, trang công khai đạt ngưỡng trong `web-quality`, có test theo `testing`.
8. **Điều kiện "Xong khi":** đối chiếu từng ý trong cột đó của milestone đang làm.
9. **Phạm vi:** không có tính năng nào ngoài `docs/SPEC.md`.

Chỉ nói "đã kiểm" cho thứ thật sự đã chạy. Thứ không kiểm được trong môi trường này (đăng nhập OAuth thật, Telegram thật, chuyển khoản thật) thì ghi rõ là chưa kiểm và chỉ cách chủ dự án tự kiểm.
