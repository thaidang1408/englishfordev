---
name: design-system
description: Hệ thống thiết kế của EPC cho người dùng là dev, gồm token màu sáng và tối, kiểu chữ, component và các chi tiết đặc trưng. Dùng mỗi khi tạo hoặc sửa bất kỳ trang, layout, component hay CSS nào.
---

# Hệ thống thiết kế

Ý tưởng xuyên suốt: **câu tiếng Anh của người dùng được review như một pull request.** Mọi màn hình mượn hình ảnh từ công cụ dev dùng hằng ngày: diff, comment review, lịch đóng góp, phím tắt. Đó là lý do một dev nhìn vào thấy quen và thấy được làm cho mình.

## Nguồn

- Token: `${CLAUDE_SKILL_DIR}/tokens.css`. Chép nguyên vào `src/styles/tokens.css` ở M1. Mọi màu, cỡ chữ, bo góc, khoảng cách trong component lấy từ biến này. Không viết mã màu trực tiếp.
- Phong cách (từ 05/10/2026, chủ dự án chọn): theo mẫu "Ruang Edit — Modern Design Learning Platform" trên Dribbble. Nền lavender sáng, thẻ trắng bo lớn, nút bo tròn có mũi tên, nhãn bo tròn trên tiêu đề mục, ô icon nền tím hoặc vàng, thẻ đánh số 01 đến 04, dải kêu gọi cuối mục. Mô tả đầy đủ ở `docs/DESIGN.md`.
- Mẫu trực quan cho component bài học: `reference/styleguide.html` (khung review, trắc nghiệm, danh sách bài, lịch luyện tập). Màu và bo góc theo token mới, không theo mã màu trong file đó.
- Chữ trên giao diện: skill `ui-vi`.

## Giao diện sáng và tối

- Mặc định theo `prefers-color-scheme`. Có nút đổi ở thanh trên, lưu lựa chọn vào `localStorage`, đặt `data-theme` trên `<html>`.
- Đặt `data-theme` bằng một đoạn script nội tuyến trong `<head>` trước khi vẽ, để không nháy màu khi tải trang.
- Mọi component phải kiểm ở cả hai giao diện. Không có màu nào chỉ đúng ở một bên.

## Bốn chi tiết đặc trưng

1. **Khung review.** Dòng gốc nền đỏ nhạt có dấu trừ, dòng sửa nền xanh nhạt có dấu cộng, chỗ thay đổi được tô đậm hơn bằng `mark`, bên dưới là comment của Coach. Dùng cho "lỗi hay gặp" và kết quả sửa câu. Không dùng để trang trí.
2. **Phím tắt.** Trắc nghiệm: `1` `2` `3` để chọn, `Enter` sang câu sau. Ô sửa câu: `Ctrl` hoặc `Cmd` + `Enter` để gửi. Hiện gợi ý phím bằng `kbd` ngay trên nút. Phím tắt không hoạt động khi con trỏ đang ở ô nhập, trừ tổ hợp gửi.
3. **Lịch luyện tập.** Lưới ô theo tuần kiểu lịch đóng góp, năm mức đậm nhạt của màu tím, đặt ở `/hom-nay`. Thay cho streak, XP và huy hiệu. Bên cạnh là ba con số: bài đã xong, câu đã được sửa, lỗi còn lặp lại.
4. **Màu tím "merged".** Chỉ dùng cho hành động chính và trạng thái "bài hôm nay". Mỗi màn hình một nút tím. Màu vàng `--amber` là màu phụ: ô sparkle cạnh từ được tô, ô icon thứ hai, gói nổi bật. Không dùng vàng cho nút chính.

## Kiểu chữ

- Be Vietnam Pro cho mọi chữ giao diện. Tiêu đề lớn nặng 800, khoảng cách chữ âm nhẹ.
- JetBrains Mono chỉ cho: câu tiếng Anh trong diff và đáp án, `kbd`, số thứ tự bài, mã chuyển khoản. Không dùng mono cho nhãn hay đoạn văn.
- Dòng chữ đọc không quá 680px. Căn trái. Không căn giữa đoạn văn.

## Bố cục

- Trang công khai rộng tối đa 1160px, phần đọc 680px. Mọi trang ngoài trang chủ mở đầu bằng `PageHead.astro`; thân trang là `.page` (bảng điều khiển, 1160px) hoặc `.page.narrow` (760px). Nội dung chia thành `.panel` có đầu thẻ (ô icon, tiêu đề, link `.go`). Xem `docs/DESIGN.md` mục 8b.
- Thanh trên dính ở đầu trang, có đủ link tới các trang chính; màn hẹp hơn 900px gom vào nút "Menu" (details/summary, chạy khi tắt JS). Chân trang có ba cột link tới mọi trang. Người dùng không phải gõ đường dẫn.
- Thẻ (`.card`) dùng cho một đơn vị thật: một bước học, một track, một gói giá, một câu trắc nghiệm, khung review. Lưới thẻ 2, 3 hoặc 4 cột ở trang công khai.
- Bóng `--shadow-card` cho thẻ; `--shadow` cho khung review ở hero.
- Bo góc theo token: 8, 12, 20, 28px. Nút và nhãn bo tròn hết cỡ (`--r-pill`).

## Chuyển động

Trang chủ được phép kể chuyện bằng chuyển động (chủ dự án chọn ngày 05/10/2026, tham khảo cách kể theo cảnh của landing page game OÁN). Năm hiệu ứng, chỉ ở trang chủ:

1. **Màn demo review ở hero** (`HeroDemo.astro`): gõ câu sai, tô chỗ sai, gõ câu đúng, hiện lời Coach, sang ví dụ kế. Ví dụ lấy từ `mistakes[]` của bài thật. Có nút "Tạm dừng" và chấm chọn ví dụ; chỉ chạy khi đang trên màn hình.
2. **Hai dải chữ chạy ngược chiều** (`MistakeMarquee.astro`): lỗi hay gặp, bản sai gạch đỏ, bản đúng xanh. Dừng khi trỏ chuột hoặc focus, có nút "Dừng chạy chữ".
3. **Câu chuyện theo cuộn** (`MorningStory.astro`): từ 1000px, khung bên phải đứng yên và đổi màn hình theo bước ở giữa màn hình. Màn hẹp là thẻ thường.
4. **Chữ nền lớn** (`.echo`) sau tiêu đề mục, chữ viền, trôi nhẹ theo cuộn.
5. **Hiện dần khi cuộn tới** (`data-reveal`), vệt sáng nhẹ theo con trỏ trên thẻ, thẻ nổi ở hero bồng bềnh.

Luật:

- Mọi chuyển động nằm sau class `motion` trên `<html>`, chỉ được gắn khi JS chạy và người dùng không bật `prefers-reduced-motion`. Không có JS: mọi nội dung hiện sẵn, đứng yên, đọc được hết.
- Nội dung tự chạy quá 5 giây phải có nút dừng (WCAG 2.2.2).
- Không thư viện chuyển động. CSS và vài dòng JS, chỉ dùng `transform` và `opacity`.
- Trong app (sau đăng nhập) chỉ có chuyển động trả lời hành động, dưới 300ms: đáp án đổi màu, kết quả hiện ra, ô lịch vừa được tô.

## Không làm

Gradient trang trí, hiệu ứng kính mờ, phát sáng neon, nền đen với một màu xanh lá chói, emoji làm icon, ảnh người thật hoặc ảnh stock, avatar và số người dùng ("2K+ members"), sao đánh giá, thanh tiến độ giả về người dùng, bộ đếm ngược, pháo hoa khi trả lời đúng. Trang trí nhỏ (sparkle, vòng tròn, chấm) chỉ ở hero trang chủ, luôn `aria-hidden`. Thẻ nổi ở hero là hình minh họa giao diện thật của EPC, không phải số liệu.

Làm xong một màn hình thì chạy skill `design-review`.
