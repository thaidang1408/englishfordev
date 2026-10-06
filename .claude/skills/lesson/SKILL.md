---
name: lesson
description: Soạn hoặc sửa một bài học tiếng Anh cho dev trong content/lessons theo đúng schema và chuẩn chất lượng của EPC. Dùng khi tạo bài mới, sửa bài, hoặc soạn placement.json.
argument-hint: "[lesson_key, ví dụ standup-04]"
---

# Soạn bài $ARGUMENTS

1. Đọc mục 6 của `docs/SPEC.md` để lấy schema, danh sách tên bài và quy tắc.
2. Đọc cả ba file mẫu `content/lessons/standup-01.json` đến `standup-03.json`. Bài mới phải cùng độ dài, cùng giọng, cùng mức khó.
3. Viết file `content/lessons/<lesson_key>.json`.
4. Chạy kiểm schema (`npm run check` hoặc script kiểm nội dung của dự án).
5. Thêm một dòng vào `docs/CONTENT_REVIEW.md`: `- [ ] <lesson_key> — <title>` để chủ dự án duyệt.

## Chuẩn chất lượng

- **Tiếng Anh phải đúng và tự nhiên.** Mỗi câu là câu một dev thật sẽ nói trong standup, Slack hoặc PR. Không câu kiểu sách giáo khoa. Không chắc một câu có tự nhiên không thì chọn câu đơn giản hơn.
- **Một bài một mẫu câu.** Không nhồi hai điểm ngữ pháp.
- **Ví dụ:** đúng 5 câu, mỗi câu một ngữ cảnh công việc khác nhau (bug, tính năng, review, deploy, họp, khách hàng, incident). Trình học hiện 3 câu ngẫu nhiên, nên câu nào cũng phải tự đứng được.
- **Lỗi hay gặp:** đúng 3 lỗi, mỗi lỗi một kiểu khác nhau, mà người Việt thật sự mắc do dịch từng chữ: thiếu mạo từ, sai thì, sai giới từ, đặt từ bổ nghĩa sau danh từ. `why_vi` một câu, nói quy tắc, không dùng thuật ngữ ngữ pháp nặng. `right_vi` là nghĩa tiếng Việt tự nhiên của câu đúng.
- **Trắc nghiệm:** đúng 10 câu, mỗi câu 3 đáp án; mỗi lượt học lấy ngẫu nhiên 5. Không có hai câu hỏi gần giống nhau, đổi ngữ cảnh và đổi kiểu lỗi giữa các câu. `answer_vi` là nghĩa tiếng Việt của đáp án đúng; câu có `prompt_vi` là câu tiếng Việt thì `answer_vi` có thể gần giống `prompt_vi`. Đáp án đúng luôn ở vị trí 0. Hai đáp án sai phải là lỗi có thật, mỗi đáp án sai một kiểu lỗi khác nhau, và chỉ có một đáp án đúng không thể tranh cãi.
- **`prompt_vi`:** là câu tiếng Việt cần nói bằng tiếng Anh, hoặc "Chọn câu đúng." Không quá 15 từ.
- **`id` câu hỏi:** chữ cái đầu của track + số bài 2 chữ số + `q` + số thứ tự. Ví dụ `s04q1`, `w02q3`, `i05q2`.
- **`free`:** chỉ `standup-01` đến `standup-03` là `true`.
- **Track interview:** có `question_en` là câu nhà tuyển dụng thật sẽ hỏi. Mẫu câu là khung trả lời. Ba ví dụ là ba câu trả lời ngắn của ba người khác nhau, để người học không chép nguyên văn. Không dạy nói quá về bản thân.
- Tiếng Việt xưng "mình" trong câu ví dụ, "bạn" trong lời hướng dẫn.

Soạn xong tự đọc lại từng đáp án đúng một lần nữa như một người bản ngữ làm trong ngành phần mềm. Câu nào còn ngờ thì viết lại.

## Chuẩn bản 1.2 (SPEC mục 15, từ 06/10/2026)

Đọc `docs/research/content-audit.md` (đánh giá từng bài) và `docs/research/content-needs.md` (nhu cầu thật) trước khi soạn.

- **`model`:** một tin, tài liệu hoặc câu trả lời hoàn chỉnh như ngoài đời, 3 đến 8 câu (phỏng vấn: STAR 80 đến 150 từ). Xuống dòng bằng `\n`. Dùng đúng mẫu câu của bài ở trong đó, nhưng có cả phần dẫn, lý do, lời kết. `title_vi` nói đây là gì ("Cập nhật standup đầy đủ", "Mô tả PR có What, Why, How to test"). `vi` dịch cả tin, giữ xuống dòng.
  - Standup: hôm qua, hôm nay, vướng mắc trong 3 đến 4 câu.
  - PR: tiêu đề, What, Why, How to test.
  - Bug: tiêu đề, Steps to reproduce, Expected, Actual, Environment.
  - Email khách: chào, điểm chính, việc tiếp theo hoặc rủi ro, cần khách làm gì, lời kết.
- **`checklist_vi`:** 3 đến 5 ý, mỗi ý một câu ngắn nói bài viết cần có gì ("Có việc hôm qua đã xong", "Nói rõ cần ai giúp gì"). AI dùng danh sách này để báo ý còn thiếu, nên mỗi ý phải kiểm được trên văn bản.
- **`write_prompt_vi`:** yêu cầu viết đúng loại tin thật, có bối cảnh cụ thể (vai, người nhận, việc). Ví dụ: "Viết cập nhật standup 3 đến 4 câu: hôm qua, hôm nay, và một chỗ đang vướng." Độ dài tối đa người dùng gửi được: 700 ký tự (phỏng vấn 1200).
- **Trắc nghiệm 10 câu:** khoảng 4 câu hình thức, 3 câu "Chọn cách nói phù hợp hơn" (cả ba đáp án đúng ngữ pháp, khác giọng điệu: quá cụt, vừa, quá vòng vo hoặc quá khiêm tốn; `why_vi` nói vì sao), 3 câu đọc hiểu ("Đồng nghiệp nhắn: '...'. Ý họ là gì?", đáp án là câu tiếng Việt hoặc tiếng Anh diễn giải; dùng viết tắt và cụm động từ thật như LGTM, PTAL, EOD, ETA, nit, roll back, look into, follow up). Câu đọc hiểu có `prompt_vi` dài tới 40 từ là được.
- **Không lặp quy tắc:** một quy tắc (thứ tự từ bổ nghĩa, động từ nguyên mẫu sau modal, mạo từ, -s) không làm đáp án sai quá 2 lần trong một bài. Đổi kiểu đáp án sai, đừng theo một công thức.
- **Mạo từ:** giải thích là "danh từ đếm được số ít cần a/the/my...; dùng the vì người nghe biết là cái nào", không viết "đếm được nên cần the".
- **"by + thời điểm"** dịch là "muộn nhất ..." hoặc "trong ... là xong", không dịch là "trước ...". Phân biệt finish **by** (hạn chót) với have time **until** (kéo dài tới).
- **Quy ước khác ngữ pháp:** câu đúng ngữ pháp nhưng sai quy ước của team (tiêu đề PR dùng quá khứ, commit dùng -ing) thì `why_vi` nói rõ là quy ước, không gọi là sai. Không đặt câu đúng ngữ pháp làm đáp án sai ở câu hỏi "Chọn câu đúng".
