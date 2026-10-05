---
name: testing
description: Chuẩn viết và chạy test của EPC bằng Vitest và Playwright. Dùng khi thêm logic nghiệp vụ, endpoint, policy RLS, hoặc khi sửa lỗi.
---

# Test

Test để chứng minh điều kiện "Xong khi" của milestone, không để đạt độ phủ.

## Phải có test

| Thứ | Loại test | Ghi chú |
| --- | --- | --- |
| Luật Leitner, tính hạn Premium, chọn bài của ngày, chấm test xếp trình độ | Unit | Hàm thuần, không mạng, không đồng hồ thật |
| Schema nội dung | Unit | Mọi file trong `content/` hợp lệ; một file sai làm test hỏng |
| Ba mức chặn của `/api/correct` | Tích hợp | AI giả lập; kiểm lượt không bị trừ khi AI lỗi |
| Mỗi endpoint | Tích hợp | 401, 400, 403 hoặc 429, và đường thành công |
| RLS | Tích hợp với database thử | A không đọc, không ghi được của B; người dùng không tự sửa được `entitlements` |
| Luồng chính | End-to-end, Playwright | Học bài 1 không đăng nhập ở bề rộng 375px; bài khóa hiện lời mời nâng cấp |

## Quy tắc

- Unit test không gọi mạng. AI, Telegram, Supabase được giả lập ở ranh giới `lib/ai`, `lib/db`.
- Thời gian được tiêm vào hàm (`now: Date`), không gọi `Date.now()` bên trong luật nghiệp vụ.
- Tên test là một câu nói rõ hành vi: `it("không trừ lượt khi AI trả sai schema")`.
- Sửa lỗi thì viết test tái hiện lỗi trước, thấy nó đỏ, rồi mới sửa.
- Không sửa test cho qua. Test đỏ nghĩa là code sai hoặc yêu cầu đổi; trường hợp sau phải nêu trong báo cáo.
- Không snapshot cả trang HTML. Kiểm đúng thứ quan trọng.
- Test không phụ thuộc thứ tự chạy và không để lại dữ liệu.

## Thứ không test tự động được

Đăng nhập OAuth thật, tin Telegram thật, chuyển khoản thật. Với những thứ này, viết các bước kiểm tay vào báo cáo milestone và không nói là đã kiểm.

## Lệnh

```bash
npm run test          # unit và tích hợp
npm run test:e2e      # Playwright, cần npm run build trước
```
