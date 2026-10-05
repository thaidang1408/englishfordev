---
name: design-system
description: Hệ thống thiết kế của EPC cho người dùng là dev, gồm token màu sáng và tối, kiểu chữ, component và các chi tiết đặc trưng. Dùng mỗi khi tạo hoặc sửa bất kỳ trang, layout, component hay CSS nào.
---

# Hệ thống thiết kế

Ý tưởng xuyên suốt: **câu tiếng Anh của người dùng được review như một pull request.** Mọi màn hình mượn hình ảnh từ công cụ dev dùng hằng ngày: diff, comment review, lịch đóng góp, phím tắt. Đó là lý do một dev nhìn vào thấy quen và thấy được làm cho mình.

## Nguồn

- Token: `${CLAUDE_SKILL_DIR}/tokens.css`. Chép nguyên vào `src/styles/tokens.css` ở M1. Mọi màu, cỡ chữ, bo góc, khoảng cách trong component lấy từ biến này. Không viết mã màu trực tiếp.
- Mẫu trực quan: `reference/styleguide.html`. Mở file này trước khi dựng component và làm cho giống: khung review, trắc nghiệm, danh sách bài, lịch luyện tập, lời mời nâng cấp, thông báo.
- Chữ trên giao diện: skill `ui-vi`.

## Giao diện sáng và tối

- Mặc định theo `prefers-color-scheme`. Có nút đổi ở thanh trên, lưu lựa chọn vào `localStorage`, đặt `data-theme` trên `<html>`.
- Đặt `data-theme` bằng một đoạn script nội tuyến trong `<head>` trước khi vẽ, để không nháy màu khi tải trang.
- Mọi component phải kiểm ở cả hai giao diện. Không có màu nào chỉ đúng ở một bên.

## Bốn chi tiết đặc trưng

1. **Khung review.** Dòng gốc nền đỏ nhạt có dấu trừ, dòng sửa nền xanh nhạt có dấu cộng, chỗ thay đổi được tô đậm hơn bằng `mark`, bên dưới là comment của Coach. Dùng cho "lỗi hay gặp" và kết quả sửa câu. Không dùng để trang trí.
2. **Phím tắt.** Trắc nghiệm: `1` `2` `3` để chọn, `Enter` sang câu sau. Ô sửa câu: `Ctrl` hoặc `Cmd` + `Enter` để gửi. Hiện gợi ý phím bằng `kbd` ngay trên nút. Phím tắt không hoạt động khi con trỏ đang ở ô nhập, trừ tổ hợp gửi.
3. **Lịch luyện tập.** Lưới ô theo tuần kiểu lịch đóng góp, năm mức đậm nhạt của màu tím, đặt ở `/hom-nay`. Thay cho streak, XP và huy hiệu. Bên cạnh là ba con số: bài đã xong, câu đã được sửa, lỗi còn lặp lại.
4. **Màu tím "merged".** Chỉ dùng cho hành động chính và trạng thái "bài hôm nay". Mỗi màn hình một nút tím.

## Kiểu chữ

- Be Vietnam Pro cho mọi chữ giao diện. Tiêu đề lớn nặng 800, khoảng cách chữ âm nhẹ.
- JetBrains Mono chỉ cho: câu tiếng Anh trong diff và đáp án, `kbd`, số thứ tự bài, mã chuyển khoản. Không dùng mono cho nhãn hay đoạn văn.
- Dòng chữ đọc không quá 680px. Căn trái. Không căn giữa đoạn văn.

## Bố cục

- Trang công khai rộng tối đa 1080px, phần đọc 680px. Trang trong app một cột, tối đa 720px.
- Thẻ chỉ dùng khi nội dung là một đơn vị thật: khung review, một câu trắc nghiệm, một lời mời nâng cấp. Không cắt mọi thứ thành lưới thẻ giống nhau.
- Phân tách bằng khoảng trắng và đường kẻ mảnh `--line`. Bóng đổ chỉ cho khung review ở trang chủ.
- Bo góc 6, 8, 10px theo token. Không bo tròn hết cỡ, trừ nhãn trạng thái.

## Chuyển động

- Một khoảnh khắc lúc tải trang chủ: dòng xanh và comment hiện ra sau dòng đỏ.
- Trong app chỉ có chuyển động trả lời hành động: đáp án đổi màu, kết quả sửa hiện ra, ô lịch vừa được tô.
- Dưới 300ms, không nảy, không trượt từng khối khi cuộn. Tắt hết khi `prefers-reduced-motion`.

## Không làm

Gradient trang trí, hiệu ứng kính mờ, phát sáng neon, nền đen với một màu xanh lá chói, emoji làm icon, ảnh minh họa người, thanh tiến độ giả, bộ đếm ngược, pháo hoa khi trả lời đúng.

Làm xong một màn hình thì chạy skill `design-review`.
