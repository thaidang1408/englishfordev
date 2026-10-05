# Nội dung chờ duyệt

Nội dung do Claude Code soạn nháp. Chủ dự án đọc và đánh dấu `[x]` khi đã duyệt. Phải duyệt hết trước khi ra mắt (M7).

Cách duyệt nhanh: chạy `npm run dev`, mở `/mau-cau/<slug>` để đọc mẫu câu, ví dụ, lỗi hay gặp; mở `/hoc/<slug>` (đã đăng nhập, đang dùng thử) để làm trắc nghiệm. Sửa thẳng file JSON trong `content/lessons/`, rồi chạy `npm run test` để kiểm schema.

Dòng "Cần xem" là câu người soạn còn phân vân. Đọc kỹ những chỗ đó trước.

## Test xếp trình độ

- [ ] placement — Test xếp trình độ, 12 câu (`content/placement.json`). Soạn sớm ở M2 vì trang `/xep-trinh-do` cần nội dung để chạy.

## Track Standup và họp

Bài 1 đến 3 là bài mẫu chủ dự án đưa vào từ đầu.

- [ ] standup-04 — Việc xong, việc còn dở (`viec-xong-viec-con-do`). Cần xem: s04q2 có đáp án sai "The UI is still doing." là câu dịch từng chữ, hơi lạ hơn là lỗi ngữ pháp rõ.
- [ ] standup-05 — Ước lượng bao lâu thì xong (`uoc-luong-bao-lau-thi-xong`). Cần xem: s05q3 đáp án sai "I need two days again." (dịch chữ "nữa").
- [ ] standup-06 — Hỏi lại khi chưa hiểu (`hoi-lai-khi-chua-hieu`).
- [ ] standup-07 — Xin người khác giúp (`xin-nguoi-khac-giup`).
- [ ] standup-08 — Báo trễ và đề xuất mốc mới (`bao-tre-va-de-xuat-moc-moi`). Cần xem: điểm "by" và "until" lặp lại với bài 5 (s08q3), cố ý để ôn lại.
- [ ] standup-09 — Không đồng ý một cách lịch sự (`khong-dong-y-mot-cach-lich-su`). Cần xem: lỗi hay gặp và s09q4 là lỗi giọng điệu ("You are wrong."), không phải lỗi ngữ pháp.
- [ ] standup-10 — Tóm tắt một buổi họp (`tom-tat-mot-buoi-hop`). Cần xem: s10q4 dùng "in Slack"; "on Slack" cũng phổ biến, hai đáp án sai vẫn sai rõ.

## Track Viết cho team

- [ ] writing-01 — Tiêu đề và mô tả pull request (`tieu-de-va-mo-ta-pull-request`). Cần xem: tiêu đề ví dụ có "the" ("for the email field"); tiêu đề thật hay bỏ mạo từ.
- [ ] writing-02 — Commit message (`commit-message`). Cần xem: commit thì quá khứ ("Fixed login bug") bị tính là sai theo quy ước git, không sai ngữ pháp; w02q5 "to the version 18" bị tính sai vì mạo từ.
- [ ] writing-03 — Comment khi review code (`comment-khi-review-code`).
- [ ] writing-04 — Trả lời comment review (`tra-loi-comment-review`).
- [ ] writing-05 — Báo một bug (`bao-mot-bug`).
- [ ] writing-06 — Hỏi trên Slack ngắn mà đủ ý (`hoi-tren-slack-ngan-ma-du-y`). Cần xem: w06q5 đáp án sai chỉ thiếu "the", lỗi nhẹ.
- [ ] writing-07 — Báo tiến độ cho khách (`bao-tien-do-cho-khach`).
- [ ] writing-08 — Email xin nghỉ, xin dời lịch (`email-xin-nghi-xin-doi-lich`).
- [ ] writing-09 — Viết ghi chú bàn giao (`viet-ghi-chu-ban-giao`).
- [ ] writing-10 — Từ chối hoặc xin thêm thời gian (`tu-choi-hoac-xin-them-thoi-gian`). Cần xem: công thức có hai phần (từ chối và xin thêm thời gian) vì tên bài gồm cả hai.

## Track Phỏng vấn (Premium)

- [ ] interview-01 — Giới thiệu bản thân (`gioi-thieu-ban-than`). Cần xem: ví dụ 3 nhắc tên công cụ thật (Playwright).
- [ ] interview-02 — Kể về dự án gần nhất (`ke-ve-du-an-gan-nhat`). Cần xem: i02q2 dùng "nearest" làm đáp án sai cho "gần nhất" về thời gian.
- [ ] interview-03 — Vai trò và đóng góp của bạn (`vai-tro-va-dong-gop`).
- [ ] interview-04 — Một bug khó bạn đã xử lý (`phong-van-bug-kho-da-xu-ly`). Cần xem: ví dụ 2 nhắc tên thư viện thật (Glide).
- [ ] interview-05 — Điểm mạnh và điểm cần cải thiện (`diem-manh-va-diem-can-cai-thien`).
- [ ] interview-06 — Vì sao muốn đổi việc (`vi-sao-muon-doi-viec`). Cần xem: i06q3 đúng nhưng hơi cứng.
- [ ] interview-07 — Bất đồng trong team và cách xử lý (`phong-van-bat-dong-trong-team`). Cần xem: lỗi "Me and my teammate disagreed" người bản ngữ vẫn nói khi nói chuyện thường, chỉ sai trong phỏng vấn.
- [ ] interview-08 — Trả lời khi không biết câu trả lời (`phong-van-khi-khong-biet-cau-tra-loi`). Cần xem: i08q1 đáp án sai "Kafka ago" có thể quá dễ.
- [ ] interview-09 — Hỏi lại nhà tuyển dụng (`hoi-lai-nha-tuyen-dung`).
- [ ] interview-10 — Nói về lương và ngày bắt đầu (`phong-van-luong-va-ngay-bat-dau`). Cần xem: i10q3 đáp án sai "inform before 30 days", why_vi giải thích ngắn.

## Trang điều khoản và bảo mật

- [ ] `/dieu-khoan` — Cần xem: cam kết "báo trước 30 ngày và hoàn tiền phần chưa dùng nếu EPC ngừng hoạt động", và việc khóa tài khoản vi phạm (làm tay trong Supabase).
- [ ] `/bao-mat` — Cần xem: cam kết xóa dữ liệu "trong vòng 7 ngày", và danh sách bên xử lý dữ liệu.
