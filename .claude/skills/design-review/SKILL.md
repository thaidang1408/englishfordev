---
name: design-review
description: Tự kiểm giao diện EPC bằng ảnh chụp màn hình thật ở điện thoại và máy tính, giao diện sáng và tối, rồi sửa những chỗ chưa đạt. Dùng sau khi dựng hoặc sửa một trang hay component nhìn thấy được.
argument-hint: "[đường dẫn, ví dụ / /hoc/hom-qua-da-lam-gi]"
---

# Kiểm giao diện bằng ảnh chụp

1. Chạy bản build: `npm run build && npm run preview`.
2. Chụp ảnh: `node ${CLAUDE_SKILL_DIR}/shots.mjs <url gốc> $ARGUMENTS`. Script chụp mỗi đường dẫn ở 375px và 1280px, sáng và tối, lưu vào `.design-shots/`. Thiếu Playwright thì cài: `npm i -D playwright && npx playwright install chromium`.
3. Mở từng ảnh và nhìn thật. Mở cả `reference/styleguide.html` để so.
4. Chấm theo danh sách dưới. Mỗi mục: đạt hoặc không đạt kèm một câu nói rõ chỗ nào.
5. Sửa các mục không đạt, chụp lại, chấm lại. Tối đa ba vòng; còn mục chưa đạt thì nêu trong báo cáo.

## Danh sách chấm

1. Trong ba giây nhìn màn hình đầu, biết đây là sản phẩm gì và phải bấm vào đâu.
2. Mỗi màn hình có đúng một nút màu tím.
3. Thứ bậc rõ: tiêu đề, nội dung chính, phần phụ khác nhau về cỡ và độ đậm, không phải mọi thứ cùng một mức.
4. Khung review nhìn ra ngay là diff: dấu trừ, dấu cộng, chỗ thay đổi được tô.
5. Giao diện tối không có chữ xám trên nền xám khó đọc, không có khối trắng sót lại, viền vẫn thấy.
6. Ở 375px: không cuộn ngang, không chữ tràn khung, vùng bấm đủ lớn, câu tiếng Anh dài tự xuống dòng.
7. Khoảng cách đều theo token, không có chỗ dính sát hoặc hở bất thường.
8. Chữ tiếng Việt hiện đủ dấu ở mọi trọng số, không rơi về font hệ thống.
9. Trạng thái trống, đang tải, lỗi đều có thiết kế, không phải màn hình trắng.
10. So với `reference/styleguide.html`: cùng màu, cùng bo góc, cùng kiểu chữ. Chỗ nào khác phải có lý do.
11. Không có thứ gì trong mục "Không làm" của skill `design-system`.

Chỉ nói "đã kiểm" cho ảnh đã thật sự mở ra xem. Không chụp được thì nói rõ là chưa kiểm bằng mắt.
